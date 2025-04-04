import {AppError} from '@gravity-ui/nodekit';
import {TransactionOrKnex, raw, transaction} from 'objection';
import {Optional} from 'utility-types';

import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {
    AJV_PATTERN_KEYS_NOT_OBJECT,
    BiTrackingLogs,
    CURRENT_TIMESTAMP,
    DEFAULT_QUERY_TIMEOUT,
    RETURN_COLUMNS,
    US_ERRORS,
} from '../../../const';
import Entry from '../../../db/models/entry';
import Lock from '../../../db/models/lock';
import {EntryColumn} from '../../../db/models/new/entry';
import {EntryScope} from '../../../db/models/new/entry/types';
import Revision from '../../../db/models/revision';
import {WorkbookPermission} from '../../../entities/workbook';
import {
    CTX,
    DlsActions,
    EntryColumns,
    RevisionColumns,
    SyncLinks,
    SyncLinksConf,
} from '../../../types/models';
import Utils, {makeUserId} from '../../../utils';
import {getWorkbook} from '../../new/workbook/get-workbook';
import {checkWorkbookPermission} from '../../new/workbook/utils';

import {checkEntry} from './check-entry';

type Mode = 'save' | 'publish' | 'recover';
const ModeValues: Mode[] = ['save', 'publish', 'recover'];

const validateUpdateEntry = makeSchemaValidator({
    type: 'object',
    required: ['entryId'],
    properties: {
        entryId: {
            type: 'string',
        },
        meta: {
            type: ['object', 'null'],
            patternProperties: AJV_PATTERN_KEYS_NOT_OBJECT,
            restrictMetaSize: true,
        },
        data: {
            type: ['object', 'null'],
        },
        unversionedData: {
            type: ['object', 'null'],
            restrictUnversionedDataSize: true,
        },
        links: {
            type: ['object'],
            patternProperties: AJV_PATTERN_KEYS_NOT_OBJECT,
        },
        hidden: {
            type: 'boolean',
        },
        lockToken: {
            type: 'string',
        },
        type: {
            type: 'string',
        },
        revId: {
            type: 'string',
        },
        mode: {
            type: 'string',
            enum: ModeValues,
        },
        skipSyncLinks: {
            type: 'boolean',
        },
        useLegacyLogin: {
            type: 'boolean',
        },
        checkServicePlan: {
            type: 'string',
        },
    },
});

type UpdateEntryData = {
    entryId: EntryColumns['entryId'];
    type?: EntryColumns['type'];
    unversionedData?: EntryColumns['unversionedData'];
    hidden?: EntryColumns['hidden'];
    mirrored?: EntryColumns['mirrored'];
    meta?: RevisionColumns['meta'];
    data?: RevisionColumns['data'];
    revId?: RevisionColumns['revId'];
    mode?: Mode;
    links?: SyncLinks;
    lockToken?: string;
    skipSyncLinks?: boolean;
    useLegacyLogin?: boolean;
    updateRevision?: boolean;
    checkServicePlan?: string;
    checkTenantFeatures?: string[];
};

export async function updateEntry(ctx: CTX, updateData: UpdateEntryData) {
    validateUpdateEntry(updateData);

    const {
        entryId,
        meta,
        data,
        unversionedData,
        links,
        mode = 'save',
        type,
        hidden,
        mirrored,
        revId,
        lockToken,
        skipSyncLinks,
        useLegacyLogin = false,
        updateRevision = false,
        checkServicePlan,
        checkTenantFeatures,
    } = updateData;

    ctx.log('UPDATE_ENTRY_REQUEST', {
        entryId: Utils.encodeId(entryId),
        meta,
        links,
        mode,
        type,
        hidden,
        mirrored,
        revId,
        lockToken,
        skipSyncLinks,
        updateRevision,
        checkServicePlan,
        checkTenantFeatures,
    });

    const registry = ctx.get('registry');
    const {DLS} = registry.common.classes.get();

    const {accessServiceEnabled} = ctx.config;
    const {user, isPrivateRoute} = ctx.get('info');

    const entry = await Entry.query(Entry.primary)
        .where({
            entryId,
        })
        .first()
        .timeout(DEFAULT_QUERY_TIMEOUT);

    if (entry) {
        if (!isPrivateRoute && !entry.workbookId) {
            await checkEntry(ctx, Entry.replica, {verifiableEntry: entry});
        }

        const {checkTenant} = registry.common.functions.get();

        await checkTenant({
            ctx,
            tenantId: entry.tenantId,
            servicePlan: checkServicePlan,
            features: checkTenantFeatures,
        });

        await Lock.checkLock({entryId, lockToken}, ctx);
    } else {
        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
    }

    let updatedBy: string;

    if (entry.workbookId) {
        updatedBy = makeUserId(user.userId);

        if (!isPrivateRoute) {
            const workbook = await getWorkbook(
                {ctx, trx: Entry.replica},
                {workbookId: entry.workbookId},
            );

            if (accessServiceEnabled) {
                await checkWorkbookPermission({
                    ctx,
                    trx: Entry.replica,
                    workbook,
                    permission: WorkbookPermission.Update,
                });
            }
        }
    } else {
        updatedBy = useLegacyLogin ? user.login : makeUserId(user.userId);

        const {isNeedBypassEntryByKey} = registry.common.functions.get();

        const dlsBypassByKeyEnabled = isNeedBypassEntryByKey(ctx, entry.key);

        if (!dlsBypassByKeyEnabled && !isPrivateRoute && ctx.config.dlsEnabled) {
            await DLS.checkPermission(
                {ctx},
                {
                    entryId,
                    action: DlsActions.Edit,
                },
            );
        }
    }

    const createOrUpdateRevision = async ({
        trx,
        syncedLinks,
    }: {
        trx: TransactionOrKnex;
        syncedLinks: SyncLinksConf['links'];
    }) => {
        let revision: Revision;

        if (isPrivateRoute && updateRevision) {
            const updatedRevision = await Revision.query(trx)
                .patch({
                    data,
                    meta,
                    links: syncedLinks,
                    updatedBy,
                    updatedAt: raw(CURRENT_TIMESTAMP),
                })
                .where({
                    revId:
                        mode === 'publish' ? (entry.publishedId ?? entry.savedId) : entry.savedId,
                    entryId: entry.entryId,
                })
                .returning('*')
                .first()
                .timeout(DEFAULT_QUERY_TIMEOUT);

            if (!updatedRevision) {
                throw new AppError(US_ERRORS.NOT_EXIST_REVISION, {
                    code: US_ERRORS.NOT_EXIST_REVISION,
                });
            }

            revision = updatedRevision;
        } else {
            revision = await Revision.query(trx)
                .insert({
                    entryId,
                    data,
                    meta,
                    links: syncedLinks,
                    createdBy: updatedBy,
                    updatedBy: updatedBy,
                })
                .returning('*')
                .timeout(DEFAULT_QUERY_TIMEOUT);
        }

        return revision;
    };

    const result = await (async () => {
        switch (mode) {
            case 'save': {
                return await transaction(Entry.primary, async (trx) => {
                    let syncedLinks: SyncLinksConf['links'] = links;
                    if (!skipSyncLinks) {
                        syncedLinks = await Entry.syncLinks({
                            entryId,
                            links,
                            ctx,
                            trxOverride: trx,
                        });
                    }

                    const revision = await createOrUpdateRevision({trx, syncedLinks});

                    const revId = revision.revId;

                    const hiddenNext = typeof hidden === 'undefined' ? entry.hidden : hidden;
                    const mirroredNext =
                        typeof mirrored === 'undefined' ? entry.mirrored : mirrored;

                    const patch: Partial<EntryColumns> = {
                        savedId: revId,
                        updatedBy: updatedBy,
                        hidden: hiddenNext,
                        mirrored: mirroredNext,
                    };

                    if (type) {
                        patch.type = type;
                    }

                    if (unversionedData) {
                        patch.unversionedData = unversionedData;
                    }

                    await Entry.query(trx)
                        .patch(patch)
                        .where({
                            entryId,
                        })
                        .timeout(DEFAULT_QUERY_TIMEOUT);

                    return await Entry.query(trx)
                        .select(RETURN_COLUMNS.concat('links'))
                        .join('revisions', 'entries.entryId', 'revisions.entryId')
                        .where({
                            'entries.entryId': entryId,
                            'revisions.revId': revId,
                            isDeleted: false,
                        })
                        .first()
                        .timeout(DEFAULT_QUERY_TIMEOUT);
                });
            }
            case 'publish': {
                return await transaction(Entry.primary, async (trx) => {
                    let entryAndRevision;

                    if (revId) {
                        const revision = await Revision.query(trx)
                            .select('links')
                            .where({entryId, revId})
                            .first()
                            .timeout(DEFAULT_QUERY_TIMEOUT);

                        if (!revision) {
                            throw new AppError(US_ERRORS.NOT_EXIST_REVISION, {
                                code: US_ERRORS.NOT_EXIST_REVISION,
                            });
                        }

                        await Entry.syncLinks({
                            entryId,
                            links: revision.links || {},
                            ctx,
                            trxOverride: trx,
                        });

                        await Entry.query(trx)
                            .patch({
                                publishedId: revId,
                                updatedBy: updatedBy,
                                updatedAt: raw(CURRENT_TIMESTAMP),
                            })
                            .where({
                                entryId,
                            })
                            .timeout(DEFAULT_QUERY_TIMEOUT);

                        entryAndRevision = await Entry.query(trx)
                            .select(RETURN_COLUMNS)
                            .join('revisions', 'entries.entryId', 'revisions.entryId')
                            .where({
                                'entries.entryId': entryId,
                                'revisions.revId': revId,
                                isDeleted: false,
                            })
                            .first()
                            .timeout(DEFAULT_QUERY_TIMEOUT);
                    } else {
                        const syncedLinks = await Entry.syncLinks({
                            entryId,
                            links,
                            ctx,
                            trxOverride: trx,
                        });

                        const revision = await createOrUpdateRevision({trx, syncedLinks});

                        const revId = revision.revId;

                        const patch: Partial<EntryColumns> = {
                            savedId: revId,
                            publishedId: revId,
                            updatedBy: updatedBy,
                        };

                        if (type) {
                            patch.type = type;
                        }

                        if (unversionedData) {
                            patch.unversionedData = unversionedData;
                        }

                        await Entry.query(trx)
                            .patch(patch)
                            .where({
                                entryId,
                            })
                            .timeout(DEFAULT_QUERY_TIMEOUT);

                        entryAndRevision = await Entry.query(trx)
                            .select(RETURN_COLUMNS)
                            .join('revisions', 'entries.entryId', 'revisions.entryId')
                            .where({
                                'entries.entryId': entryId,
                                'revisions.revId': revId,
                                isDeleted: false,
                            })
                            .first()
                            .timeout(DEFAULT_QUERY_TIMEOUT);
                    }

                    return entryAndRevision;
                });
            }
            case 'recover': {
                return await transaction(Entry.primary, async (trx) => {
                    const entry = await Entry.query(trx)
                        .select()
                        .where({
                            entryId,
                            isDeleted: true,
                        })
                        .first()
                        .timeout(DEFAULT_QUERY_TIMEOUT);

                    const entryObj: EntryColumns | undefined = entry ? entry.toJSON() : undefined;

                    if (entryObj) {
                        const entryTenantId = entryObj.tenantId;

                        const entryObjInnerMeta = entryObj.innerMeta as NonNullable<
                            EntryColumns['innerMeta']
                        >;
                        const newKey = entryObjInnerMeta.oldKey;

                        if (entryObj.workbookId) {
                            await getWorkbook({ctx}, {workbookId: entryObj.workbookId});
                        } else {
                            const keyLowerCase = newKey.toLowerCase();
                            const isFolder = Utils.isFolder({scope: entryObj.scope});
                            const keyFormatted = Utils.formatKey(keyLowerCase, isFolder);

                            const parentFolderKeys = Utils.getFullParentFolderKeys(
                                keyFormatted,
                            ).filter((key) => !Utils.isRoot(key));

                            if (parentFolderKeys.length) {
                                const parentFolders = await Entry.query(trx)
                                    .where({
                                        [EntryColumn.TenantId]: entryTenantId,
                                        [EntryColumn.Scope]: EntryScope.Folder,
                                        [EntryColumn.IsDeleted]: false,
                                    })
                                    .whereIn(EntryColumn.Key, parentFolderKeys)
                                    .timeout(Entry.DEFAULT_QUERY_TIMEOUT);

                                const existingKeysParentFolders = new Set<string>();

                                const notFoundParentFolders: string[] = [];

                                parentFolders.forEach((folder) => {
                                    existingKeysParentFolders.add(folder.key);
                                });

                                parentFolderKeys.forEach((key) => {
                                    if (!existingKeysParentFolders.has(key)) {
                                        notFoundParentFolders.push(key);
                                    }
                                });

                                if (notFoundParentFolders.length) {
                                    throw new AppError(
                                        `Couldn't found these parent folders - '${notFoundParentFolders.join(
                                            ', ',
                                        )}'`,
                                        {
                                            code: US_ERRORS.PARENT_FOLDER_NOT_EXIST,
                                        },
                                    );
                                }
                            }
                        }

                        if (entryObj.scope === 'folder') {
                            const entryObjKey = entryObj.key;

                            const children = await Entry.query(trx)
                                .select()
                                .where('key', 'like', `${Utils.escapeStringForLike(entryObjKey)}%`)
                                .where({tenantId: entryTenantId})
                                .timeout(DEFAULT_QUERY_TIMEOUT);

                            await Promise.all(
                                children.map((entity) => {
                                    const childentryId = entity.entryId;
                                    const entityInnerMeta = entity.innerMeta as NonNullable<
                                        EntryColumns['innerMeta']
                                    >;

                                    const newKey = entityInnerMeta.oldKey;
                                    const newDisplayKey = entityInnerMeta.oldDisplayKey;
                                    const newInnerMeta: Optional<typeof entityInnerMeta> =
                                        entityInnerMeta;
                                    delete newInnerMeta.oldKey;

                                    return Entry.query(trx)
                                        .patch({
                                            key: newKey,
                                            displayKey: newDisplayKey,
                                            innerMeta: newInnerMeta as EntryColumns['innerMeta'],
                                            isDeleted: false,
                                            deletedAt: null,
                                            updatedBy: updatedBy,
                                            updatedAt: raw(CURRENT_TIMESTAMP),
                                        })
                                        .where({
                                            entryId: childentryId,
                                        })
                                        .timeout(DEFAULT_QUERY_TIMEOUT);
                                }),
                            );
                        } else {
                            const newDisplayKey = entryObjInnerMeta.oldDisplayKey;
                            const newInnerMeta: Optional<typeof entryObjInnerMeta> =
                                entryObjInnerMeta;
                            delete newInnerMeta.oldKey;

                            await Entry.query(trx)
                                .patch({
                                    key: newKey,
                                    displayKey: newDisplayKey,
                                    innerMeta: newInnerMeta as EntryColumns['innerMeta'],
                                    isDeleted: false,
                                    deletedAt: null,
                                    updatedBy: updatedBy,
                                    updatedAt: raw(CURRENT_TIMESTAMP),
                                })
                                .where({
                                    entryId,
                                })
                                .timeout(DEFAULT_QUERY_TIMEOUT);
                        }
                    } else {
                        throw new AppError(US_ERRORS.NOT_EXIST_DELETED_ENTRY, {
                            code: US_ERRORS.NOT_EXIST_DELETED_ENTRY,
                        });
                    }

                    return await Entry.query(trx)
                        .select(RETURN_COLUMNS)
                        .join('revisions', 'entries.savedId', 'revisions.revId')
                        .where({
                            'entries.entryId': entryId,
                            isDeleted: false,
                        })
                        .first()
                        .timeout(DEFAULT_QUERY_TIMEOUT);
                });
            }
            default: {
                throw new AppError("This mode doesn't allowed", {
                    code: US_ERRORS.MODE_NOT_ALLOWED,
                });
            }
        }
    })();

    ctx.log(BiTrackingLogs.UpdateEntry, {
        entryId: Utils.encodeId(entryId),
    });

    return result;
}
