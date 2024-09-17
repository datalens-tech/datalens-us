import {AppError} from '@gravity-ui/nodekit';
import {transaction} from 'objection';
import Entry from '../../../db/models/entry';
import Lock from '../../../db/models/lock';
import {EntryColumns, DlsActions, UsPermissions} from '../../../types/models';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {RETURN_COLUMNS, BiTrackingLogs, DEFAULT_QUERY_TIMEOUT, US_ERRORS} from '../../../const';
import Utils, {makeUserId} from '../../../utils';
import {getWorkbook} from '../../new/workbook/get-workbook';
import {WorkbookPermission} from '../../../entities/workbook';
import {checkWorkbookPermission} from '../../new/workbook/utils';
import {markEntryAsDeleted} from '../crud';
import {checkEntry} from './check-entry';
import {ServiceArgs} from '../../new/types';
import {registry} from '../../../registry';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['entryId'],
    properties: {
        entryId: {
            type: 'string',
        },
        lockToken: {
            type: 'string',
        },
        useLegacyLogin: {
            type: 'boolean',
        },
    },
});

export type DeleteEntryData = {
    entryId: string;
    lockToken?: string;
    useLegacyLogin?: boolean;
};

export async function deleteEntry(
    {ctx, skipValidation = false}: ServiceArgs,
    args: DeleteEntryData,
) {
    const {entryId, lockToken, useLegacyLogin = false} = args;

    ctx.log('DELETE_ENTRY_REQUEST', {
        entryId: Utils.encodeId(entryId),
        lockToken,
    });

    const {DLS} = registry.common.classes.get();

    if (!skipValidation) {
        validateArgs(args);
    }

    const {accessServiceEnabled} = ctx.config;
    const {tenantId, isPrivateRoute, user} = ctx.get('info');
    const deletedBy = useLegacyLogin ? user.login : makeUserId(user.userId);

    const result = await transaction(Entry.primary, async (trx) => {
        const entry = await Entry.query(trx)
            .select()
            .where({
                entryId,
                isDeleted: false,
            })
            .first()
            .timeout(DEFAULT_QUERY_TIMEOUT);

        if (!entry) {
            throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
                code: US_ERRORS.NOT_EXIST_ENTRY,
            });
        }

        if (Utils.isUsersFolder(entry.key)) {
            throw new AppError("Folder 'Users' cannot be deleted", {
                code: US_ERRORS.MODIFY_USERS_FOLDER_DENIED,
            });
        }

        const entryObj: EntryColumns = entry.toJSON();

        if (entryObj.workbookId) {
            if (!isPrivateRoute) {
                const workbook = await getWorkbook(
                    {ctx, trx: Entry.replica},
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
            }
        } else {
            await checkEntry(ctx, trx, {verifiableEntry: entryObj});

            if (!isPrivateRoute && ctx.config.dlsEnabled) {
                await DLS.checkPermission(
                    {ctx, trx},
                    {
                        entryId,
                        action: DlsActions.SetPermissions,
                    },
                );
            }
        }

        await Lock.checkLock({entryId, lockToken}, ctx);

        if (entryObj.scope === 'folder') {
            const entryObjKey = entryObj.key;
            const newFolderName = `${entryObj.entryId}_${
                entryObj.displayKey.split('/').splice(-2, 1)[0]
            }/`;
            const children = await Entry.query(trx)
                .select()
                .where('key', 'like', `${Utils.escapeStringForLike(entryObjKey)}%`)
                .where({tenantId})
                .timeout(DEFAULT_QUERY_TIMEOUT);

            if (!isPrivateRoute && ctx.config.dlsEnabled) {
                const haveEntriesWithPermissionsLess =
                    await Entry.checkExistenceEntriesWithInsufficientPermissions({
                        entries: children,
                        permission: UsPermissions.Admin,
                        ctx,
                        trx,
                    });

                if (haveEntriesWithPermissionsLess) {
                    throw new AppError(US_ERRORS.ENTRIES_WITH_INSUFFICIENT_PERMISSIONS, {
                        code: US_ERRORS.ENTRIES_WITH_INSUFFICIENT_PERMISSIONS,
                    });
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
            };

            await markEntryAsDeleted(trx, {
                entryId,
                newKey,
                newDisplayKey: newKey,
                newInnerMeta,
                updatedBy: deletedBy,
            });
        }

        return await Entry.query(trx)
            .select([...RETURN_COLUMNS, 'isDeleted', 'deletedAt'])
            .join('revisions', 'entries.savedId', 'revisions.revId')
            .where({
                'entries.entryId': entryId,
                isDeleted: true,
            })
            .first()
            .timeout(DEFAULT_QUERY_TIMEOUT);
    });

    ctx.log(BiTrackingLogs.DeleteEntry, {
        entryId: Utils.encodeId(entryId),
    });

    return result;
}
