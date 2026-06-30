import {transaction} from 'objection';

import {
    EntriesWithInsufficientPermissionsError,
    ModifyUsersFolderDeniedError,
    NotExistEntryError,
} from '../../../components/errors';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {
    ALLOWED_SCOPE_VALUES,
    BiTrackingLogs,
    DEFAULT_QUERY_TIMEOUT,
    RETURN_COLUMNS,
} from '../../../const';
import {default as OldEntry} from '../../../db/models/entry';
import {EntryColumn, Entry as EntryModel} from '../../../db/models/new/entry';
import {WorkbookPermission} from '../../../entities/workbook';
import {DlsActions, EntryColumns, EntryScope, UsPermissions} from '../../../types/models';
import Utils, {makeUserId} from '../../../utils';
import {getParentIds} from '../../new/collection/utils/get-parents';
import {
    CollectionEntryPermissions,
    checkCollectionEntryPermission,
    createCollectionEntry,
} from '../../new/entry/collection-entry';
import {checkPrivateScopeAccess} from '../../new/entry/utils';
import {checkLock} from '../../new/lock';
import {ServiceArgs} from '../../new/types';
import {getWorkbook} from '../../new/workbook/get-workbook';
import {checkWorkbookPermission} from '../../new/workbook/utils';
import {markEntryAsDeleted} from '../crud';
import {ReturnColumnsEntry} from '../types';

import {checkEntry} from './check-entry';

export type DeletedEntry = ReturnColumnsEntry & {
    isDeleted: boolean;
    deletedAt: string | null;
};

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['entryId'],
    properties: {
        entryId: {type: 'string'},
        lockToken: {type: 'string'},
        useLegacyLogin: {type: 'boolean'},
        scope: {type: 'string', enum: ALLOWED_SCOPE_VALUES},
        types: {type: 'array', items: {type: 'string'}},
    },
});

export type DeleteEntryData = {
    entryId: string;
    lockToken?: string;
    useLegacyLogin?: boolean;
    scope?: EntryScope;
    types?: string[];
};

export async function deleteEntry(
    {ctx, checkLicense, skipValidation = false}: ServiceArgs,
    args: DeleteEntryData,
) {
    const {entryId, lockToken, useLegacyLogin = false, scope, types} = args;

    ctx.log('DELETE_ENTRY_REQUEST', {
        entryId: Utils.encodeId(entryId),
        lockToken,
    });

    const registry = ctx.get('registry');
    const {DLS} = registry.common.classes.get();
    const {fetchAndValidateLicenseOrFail} = registry.common.functions.get();

    if (!skipValidation) {
        validateArgs(args);
    }

    const {tenantId, user, isPrivateRoute} = ctx.get('info');

    if (checkLicense && !isPrivateRoute) {
        await fetchAndValidateLicenseOrFail({ctx});
    }

    const {accessServiceEnabled} = ctx.config;
    const deletedBy = useLegacyLogin ? user.login : makeUserId(user.userId);

    const result = await transaction(OldEntry.primary, async (trx) => {
        const entry = await OldEntry.query(trx)
            .select()
            .where({
                entryId,
                isDeleted: false,
            })
            .where((builder) => {
                if (scope) {
                    builder.andWhere({[`${OldEntry.tableName}.${EntryColumn.Scope}`]: scope});
                }

                if (types) {
                    builder.whereIn([`${OldEntry.tableName}.${EntryColumn.Type}`], types);
                }
            })
            .first()
            .timeout(DEFAULT_QUERY_TIMEOUT);

        if (!entry) {
            throw new NotExistEntryError();
        }

        checkPrivateScopeAccess({ctx}, entry.scope);

        if (Utils.isUsersFolder(entry.key)) {
            throw new ModifyUsersFolderDeniedError({message: "Folder 'Users' cannot be deleted"});
        }

        const entryObj: EntryColumns = entry.toJSON();

        if (!entryObj.workbookId) {
            await checkEntry(ctx, trx, {verifiableEntry: entryObj});
        }

        if (!isPrivateRoute) {
            if (entryObj.workbookId) {
                const workbook = await getWorkbook(
                    {ctx, trx: OldEntry.replica},
                    {workbookId: entryObj.workbookId},
                );
                if (accessServiceEnabled) {
                    await checkWorkbookPermission({
                        ctx,
                        trx,
                        workbook,
                        permission: WorkbookPermission.Update,
                    });
                }
            } else if (entryObj.collectionId) {
                if (accessServiceEnabled) {
                    await checkCollectionEntryPermission(
                        {ctx, trx},
                        {entry: entryObj, permission: CollectionEntryPermissions.Delete},
                    );
                }
            } else if (ctx.config.dlsEnabled) {
                await DLS.checkPermission({ctx, trx}, {entryId, action: DlsActions.SetPermissions});
            }
        }

        await checkLock({ctx}, {entryId, lockToken});

        if (entryObj.scope === 'folder') {
            const entryObjKey = entryObj.key;
            const newFolderName = `${entryObj.entryId}_${
                entryObj.displayKey.split('/').splice(-2, 1)[0]
            }/`;
            const children = await OldEntry.query(trx)
                .select()
                .where('key', 'like', `${Utils.escapeStringForLike(entryObjKey)}%`)
                .where({tenantId})
                .timeout(DEFAULT_QUERY_TIMEOUT);

            if (!isPrivateRoute && ctx.config.dlsEnabled) {
                const haveEntriesWithPermissionsLess =
                    await OldEntry.checkExistenceEntriesWithInsufficientPermissions({
                        entries: children,
                        permission: UsPermissions.Admin,
                        ctx,
                        trx,
                    });

                if (haveEntriesWithPermissionsLess) {
                    throw new EntriesWithInsufficientPermissionsError();
                }
            }

            await Promise.all(
                children.map((entity) => {
                    const {entryId: childEntryId, displayKey, key} = entity;

                    let newKey: string | string[] = [...displayKey];
                    newKey.splice(0, entryObjKey.length, newFolderName);
                    newKey = newKey.join('');
                    const newKeyLowerCase = newKey && newKey.toLowerCase();

                    const newInnerMeta = {
                        ...entity.innerMeta,
                        oldKey: key,
                        oldDisplayKey: displayKey,
                        lastDeletionUserId: user.userId,
                    };

                    return markEntryAsDeleted(trx, {
                        entryId: childEntryId,
                        newKey: newKeyLowerCase,
                        newDisplayKey: newKey,
                        newInnerMeta,
                        updatedBy: deletedBy,
                    });
                }),
            );
        } else {
            const pathWithName = entryObj.displayKey.split('/');
            const name = pathWithName.pop();
            const oldKeyLowerCase = entryObj.displayKey && entryObj.displayKey.toLowerCase();
            const oldKey = entryObj.displayKey;

            const newKey = `${entryObj.entryId}_${name}`;
            const newInnerMeta = {
                ...entryObj.innerMeta,
                oldKey: oldKeyLowerCase,
                oldDisplayKey: oldKey,
                lastDeletionUserId: user.userId,
            };

            await markEntryAsDeleted(trx, {
                entryId,
                newKey,
                newDisplayKey: newKey,
                newInnerMeta,
                updatedBy: deletedBy,
            });
        }

        return (await OldEntry.query(trx)
            .select([...RETURN_COLUMNS, 'isDeleted', 'deletedAt'])
            .join('revisions', 'entries.savedId', 'revisions.revId')
            .where({
                'entries.entryId': entryId,
                isDeleted: true,
            })
            .first()
            .timeout(DEFAULT_QUERY_TIMEOUT)) as DeletedEntry | undefined;
    });

    if (result && result.collectionId) {
        const parentIds = await getParentIds({
            ctx,
            collectionId: result.collectionId,
        });

        const instance = createCollectionEntry(ctx, result as unknown as EntryModel);
        await instance.deletePermissions({
            parentIds,
            skipCheckPermissions: true,
        });
    }

    if (!result) {
        throw new NotExistEntryError({
            message: 'Entry deletion failed: entry not found after delete',
        });
    }

    ctx.log(BiTrackingLogs.DeleteEntry, {
        entryId: Utils.encodeId(entryId),
    });

    return result;
}
