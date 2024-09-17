import {transaction} from 'objection';
import {Model, getId} from '../..';
import Utils, {makeUserId} from '../../../utils';
import Revision from '../revision';
import Tenant from '../tenant';
import Link from '../links';
import {AppError} from '@gravity-ui/nodekit';
import * as MT from '../../../types/models';
import {validateCreateEntry, validateResolveTenantIdByEntryId} from './scheme';
import {RETURN_COLUMNS, BiTrackingLogs, US_ERRORS} from '../../../const';
import {registry} from '../../../registry';

interface Entry extends MT.EntryColumns {
    revisions: any; // TODO: Figure out how to type a upsertGraph
    permissions?: MT.UsPermission;
}
class Entry extends Model {
    static get tableName() {
        return 'entries';
    }

    static get idColumn() {
        return 'entryId';
    }

    static get relationMappings() {
        return {
            revisions: {
                relation: Model.BelongsToOneRelation,
                modelClass: Revision,
                join: {
                    from: 'entries.savedId',
                    to: 'revisions.revId',
                },
            },
        };
    }

    static originatePermissions({
        isPrivateRoute,
        shared,
        permissions,
        iamPermissions,
        ctx,
    }: MT.OriginatePermissionsConf) {
        let originatedPermissions;

        if (shared) {
            originatedPermissions = {
                execute: true,
                read: true,
                edit: false,
                admin: false,
            };
        } else if (iamPermissions !== undefined) {
            originatedPermissions = {
                execute: iamPermissions.execute ?? false,
                read: iamPermissions.read ?? false,
                edit: iamPermissions.edit ?? false,
                admin: iamPermissions.admin ?? false,
            };
        } else if (isPrivateRoute || !ctx.config.dlsEnabled) {
            originatedPermissions = {
                execute: true,
                read: true,
                edit: true,
                admin: true,
            };
        } else {
            const {extra: {execute, read, edit, set_permissions: admin} = {} as MT.DlsPermission} =
                permissions || {};

            originatedPermissions = {
                execute,
                read,
                edit,
                admin,
            };
        }

        return originatedPermissions;
    }

    static async _getEntriesByKey(
        {key, requestedBy, branch = 'saved', isDeleted = false}: MT.PrivateGetAllEntriesByKeyConfig,
        ctx: MT.CTX,
    ) {
        ctx.log('PRIVATE_GET_ENTRIES_BY_KEY_REQUEST', {
            key,
            requestedBy,
            branch,
            isDeleted,
        });

        let result;
        const keyLowerCase = key && key.toLowerCase();

        if (branch === 'published') {
            result = await Entry.query(this.replica)
                .select([...RETURN_COLUMNS, 'innerMeta', 'tenantId as folderId'])
                .join('revisions', 'entries.publishedId', 'revisions.revId')
                .where({
                    key: keyLowerCase,
                    isDeleted: isDeleted,
                })
                .timeout(Model.DEFAULT_QUERY_TIMEOUT);
        } else {
            result = await Entry.query(this.replica)
                .select([...RETURN_COLUMNS, 'innerMeta', 'tenantId as folderId'])
                .join('revisions', 'entries.savedId', 'revisions.revId')
                .where({
                    key: keyLowerCase,
                    isDeleted: isDeleted,
                })
                .timeout(Model.DEFAULT_QUERY_TIMEOUT);
        }

        if (!result.length) {
            throw new AppError('NOT_EXIST_ENTRY', {
                code: 'NOT_EXIST_ENTRY',
            });
        }

        ctx.log('PRIVATE_GET_ENTRIES_BY_KEY_SUCCESS');

        return result;
    }

    static async syncLinks({entryId, links, ctx, trxOverride}: MT.SyncLinksConf) {
        ctx.log('SYNC_LINKS');

        if (links) {
            await Link.sync({entryId, links, ctx, trxOverride});
        }

        return links;
    }

    static async create(
        {
            tenantId,
            scope,
            type,
            key,
            meta,
            innerMeta = null,
            unversionedData,
            hidden = false,
            mirrored = false,
            mode = 'save',
            recursion,
            requestedBy,
            data,
            links,
            permissionsMode,
            includePermissionsInfo,
            initialPermissions,
            initialParentId,
            isPrivateRoute = false,
            disableCheckPermission = false,
            verbose = false,
            trxOverride,
            dlContext,
            useLegacyLogin = false,
        }: MT.CreationEntryConfig,
        ctx: MT.CTX,
    ) {
        const createdBy = useLegacyLogin ? requestedBy.login : makeUserId(requestedBy.userId);

        ctx.log('CREATE_ENTRY_REQUEST', {
            tenantId,
            scope,
            type,
            key,
            meta,
            links,
            hidden,
            mirrored,
            mode,
            recursion,
            createdBy,
            requestedBy,
            permissionsMode,
            includePermissionsInfo,
            initialPermissions,
            initialParentId,
            isPrivateRoute,
            dlContext,
        });

        const {DLS} = registry.common.classes.get();

        const isDeleted = false;
        const deletedAt = null;

        const isLastLetterSlash = key.slice(-1) === '/';

        if (isLastLetterSlash) {
            key = key.slice(0, key.length - 1);
        }

        const {isValid, validationErrors} = validateCreateEntry({
            tenantId,
            scope,
            type,
            key,
            meta,
            links,
            recursion,
            createdBy,
            data,
            unversionedData,
            permissionsMode,
            initialPermissions,
            mirrored,
            mode,
        });

        if (!isValid) {
            throw new AppError('Validation error', {
                code: US_ERRORS.VALIDATION_ERROR,
                details: {validationErrors},
            });
        }

        const keyLowerCase = key && key.toLowerCase();
        const isFolder = Utils.isFolder({scope});
        const displayKey = Utils.formatKey(key, isFolder);
        const keyFormatted = Utils.formatKey(keyLowerCase, isFolder);
        const parentFolderKey = Utils.getParentFolderKey({keyFormatted});

        const {isNeedBypassEntryByKey} = registry.common.functions.get();

        const dlsBypassByKeyEnabled = isNeedBypassEntryByKey(ctx, key);

        let parentFolder: any;

        // eslint-disable-next-line complexity
        const result = await transaction(this.primary, async (trx) => {
            const TRX = trxOverride || trx;
            let createdEntries: Entry[] = [];

            if (!isPrivateRoute && !disableCheckPermission) {
                const isTenantExistence = await Tenant.checkExistence(tenantId, ctx);

                if (!isTenantExistence) {
                    throw new AppError(US_ERRORS.NOT_EXIST_TENANT, {
                        code: US_ERRORS.NOT_EXIST_TENANT,
                    });
                }
            }

            if (parentFolderKey !== '/') {
                if (recursion) {
                    const folderKeysMap = Utils.getFoldersKeys({
                        folderKey: Utils.getParentFolderKey({keyFormatted: displayKey}),
                    }).reduce((keysMap: {[key: string]: null}, folderKey: string) => {
                        keysMap[folderKey] = null;

                        return keysMap;
                    }, {});

                    const folderKeys = Object.keys(folderKeysMap);
                    const folderKeysLowerCase = Object.keys(folderKeysMap).map((key) =>
                        key.toLowerCase(),
                    );
                    const existedFolders = await Entry.query(TRX)
                        .select(['display_key as key', 'entryId'])
                        .where({tenantId})
                        .whereIn('key', folderKeysLowerCase);

                    let existedParentFolder: Entry;

                    existedFolders.forEach((existedFolder) => {
                        const existedFolderJSON = existedFolder.toJSON();

                        const entryId = existedFolderJSON.entryId;

                        const key = existedFolderJSON.key;

                        folderKeysMap[key] = entryId;
                        folderKeysMap[key && key.toLowerCase()] = entryId;

                        return existedFolderJSON;
                    });

                    if (existedFolders.length) {
                        existedParentFolder = existedFolders.reduce((existedLeafFolder, folder) => {
                            const {key} = folder;
                            const {key: existedLeafKey} = existedLeafFolder;
                            let currentExistedLeafFolder = existedLeafFolder;

                            if (key.length > existedLeafKey.length) {
                                currentExistedLeafFolder = folder;
                            }

                            return currentExistedLeafFolder;
                        }, existedFolders[0]);

                        if (
                            !disableCheckPermission &&
                            !dlsBypassByKeyEnabled &&
                            !isPrivateRoute &&
                            ctx.config.dlsEnabled
                        ) {
                            if (existedParentFolder) {
                                await DLS.checkPermission(
                                    {ctx, trx: TRX},
                                    {
                                        entryId: existedParentFolder.entryId,
                                        action: MT.DlsActions.Edit,
                                    },
                                );
                            }
                        }
                    }

                    const notExistedFolderKeys = folderKeys.filter((folderKey) => {
                        return !existedFolders.find((existedFolderKey) => {
                            return existedFolderKey.key.toLowerCase() === folderKey.toLowerCase();
                        });
                    });

                    ctx.log('CREATE_ENTRY_NOT_EXISTED_FOLDERS', {notExistedFolderKeys});

                    createdEntries = await Promise.all(
                        notExistedFolderKeys.map(async (folderKey) => {
                            const [entryId, revId] = await Promise.all([getId(), getId()]);

                            folderKeysMap[folderKey] = entryId;
                            folderKeysMap[folderKey && folderKey.toLowerCase()] = entryId;

                            const folderLowerKey = folderKey && folderKey.toLowerCase();

                            const createdEntry = await Entry.query(TRX)
                                .insert({
                                    entryId,
                                    savedId: revId,
                                    key: folderLowerKey,
                                    displayKey: folderKey,
                                    tenantId,
                                    scope: 'folder',
                                    type: '',
                                    innerMeta: null,
                                    createdBy: createdBy,
                                    updatedBy: createdBy,
                                    isDeleted,
                                    deletedAt,
                                    hidden,
                                    mirrored,
                                })
                                .returning('*');

                            await Revision.query(TRX).insert({
                                revId: revId,
                                entryId,
                                meta: {},
                                data: {},
                                createdBy: createdBy,
                                updatedBy: createdBy,
                            });

                            if (
                                !dlsBypassByKeyEnabled &&
                                !isPrivateRoute &&
                                ctx.config.dlsEnabled
                            ) {
                                const existedParentFolderKey =
                                    (existedParentFolder && existedParentFolder.key) || '/';

                                await DLS.addEntity(
                                    {ctx, trx: TRX},
                                    {
                                        entryId,
                                        permissionsMode,
                                        initialPermissions,
                                        initialParentId,
                                        scope: 'folder',
                                        parentFolderKey: existedParentFolderKey,
                                        parentFolder: {
                                            entryId: folderKeysMap[existedParentFolderKey],
                                        },
                                    },
                                );
                            }

                            return createdEntry;
                        }),
                    );
                }

                parentFolder = await Entry.query(TRX)
                    .select(RETURN_COLUMNS)
                    .join('revisions', 'entries.savedId', 'revisions.revId')
                    .where({
                        tenantId,
                        displayKey: Utils.getParentFolderKey({keyFormatted: displayKey}),
                        isDeleted: false,
                    })
                    .first();

                if (parentFolder) {
                    if (
                        !disableCheckPermission &&
                        !recursion &&
                        !dlsBypassByKeyEnabled &&
                        !isPrivateRoute &&
                        ctx.config.dlsEnabled
                    ) {
                        await DLS.checkPermission(
                            {ctx, trx: TRX},
                            {
                                entryId: parentFolder.entryId,
                                action: MT.DlsActions.Edit,
                            },
                        );
                    }
                } else {
                    throw new AppError("The parent folder doesn't exist.", {
                        code: 'PARENT_FOLDER_NOT_EXIST',
                    });
                }
            }

            const checkExistenceEntry: Optional<Entry> = await Entry.query(TRX)
                .where({
                    key: keyFormatted,
                    tenantId,
                })
                .first()
                .timeout(Entry.DEFAULT_QUERY_TIMEOUT);

            if (checkExistenceEntry) {
                throw new AppError(US_ERRORS.ENTRY_ALREADY_EXISTS, {
                    code: US_ERRORS.ENTRY_ALREADY_EXISTS,
                    details: {
                        entryId: Utils.encodeId(checkExistenceEntry.entryId),
                    },
                });
            }

            const [entryId, revId] = await Promise.all([getId(), getId()]);

            const syncedLinks = await Entry.syncLinks({entryId, links, ctx, trxOverride: TRX});

            const newData = {
                entryId,
                savedId: revId,
                key: keyFormatted,
                displayKey,
                tenantId,
                scope,
                type,
                innerMeta,
                unversionedData,
                createdBy: createdBy,
                updatedBy: createdBy,
                isDeleted,
                deletedAt,
                hidden,
                mirrored,
                ...(mode === 'publish' ? {publishedId: revId} : {}),
            };

            const targetCreatedEntry = await Entry.query(TRX).insert(newData).returning('*');

            await Revision.query(TRX).insert({
                revId: revId,
                entryId,
                meta,
                data,
                links: syncedLinks,
                createdBy: createdBy,
                updatedBy: createdBy,
            });

            if (!dlsBypassByKeyEnabled && !isPrivateRoute && ctx.config.dlsEnabled) {
                await DLS.addEntity(
                    {ctx, trx: TRX},
                    {
                        entryId,
                        scope,
                        permissionsMode,
                        initialPermissions,
                        initialParentId,
                        parentFolderKey,
                        parentFolder: {
                            entryId: parentFolderKey === '/' ? {} : parentFolder.entryId,
                        },
                    },
                );
            }

            createdEntries.unshift(targetCreatedEntry);

            let allCreatedEntries;

            if (verbose) {
                const entryIds = createdEntries.map((entry: MT.EntryType) => entry.entryId);

                allCreatedEntries = await Entry.query(TRX)
                    .select(RETURN_COLUMNS)
                    .join('revisions', 'entries.entryId', 'revisions.entryId')
                    .where({isDeleted: false})
                    .whereIn('entries.entryId', entryIds)
                    .timeout(Model.DEFAULT_QUERY_TIMEOUT);
            } else {
                allCreatedEntries = await Entry.query(TRX)
                    .select(RETURN_COLUMNS.concat('links'))
                    .join('revisions', 'entries.entryId', 'revisions.entryId')
                    .where({
                        'entries.entryId': entryId,
                        isDeleted: false,
                    })
                    .first()
                    .timeout(Model.DEFAULT_QUERY_TIMEOUT);
            }

            return allCreatedEntries;
        });

        ctx.log(BiTrackingLogs.CreateEntry, {
            entryId: result && !Array.isArray(result) ? Utils.encodeId(result.entryId) : null,
        });

        if (includePermissionsInfo) {
            const createdEntry = Object.assign({}, result, {
                permissions: {
                    execute: true,
                    read: true,
                    edit: true,
                    admin: true,
                },
            });
            return createdEntry;
        } else {
            return result;
        }
    }

    static async _create(
        {
            requestId,
            masterToken,
            tenantId,
            scope,
            type = '',
            key,
            meta,
            hidden = false,
            mirrored = false,
            mode,
            recursion,
            requestedBy,
            data,
            unversionedData,
            links,
            permissionsMode,
            initialPermissions,
            initialParentId,
            isPrivateRoute = false,
            dlContext,
        }: MT.PrivateCreationEntryConfig,
        ctx: MT.CTX,
    ) {
        ctx.log('PRIVATE_CREATE_ENTRY_REQUEST', {
            tenantId,
            masterToken,
            scope,
            type,
            key,
            meta,
            links,
            hidden,
            mirrored,
            mode,
            recursion,
            permissionsMode,
            initialPermissions,
            initialParentId,
            requestedBy,
            isPrivateRoute,
        });

        const {DLS} = registry.common.classes.get();

        const result = await transaction(this.primary, async (trx) => {
            const entries: MT.EntryType | MT.EntryType[] | undefined = await Entry.create(
                {
                    requestId,
                    tenantId,
                    scope,
                    type,
                    key,
                    meta,
                    hidden,
                    mirrored,
                    mode,
                    recursion,
                    data,
                    unversionedData,
                    links,
                    permissionsMode,
                    initialPermissions,
                    initialParentId,
                    requestedBy,
                    isPrivateRoute,
                    disableCheckPermission: true,
                    trxOverride: trx,
                    verbose: true,
                    dlContext,
                },
                ctx,
            );

            if (ctx.config.dlsEnabled && !initialPermissions && Array.isArray(entries)) {
                await Promise.all(
                    entries.map(async (entry) => {
                        return await DLS.modifyPermissions(
                            {ctx, trx},
                            {
                                entryId: entry.entryId,
                                body: {
                                    diff: {
                                        added: {},
                                        removed: {
                                            acl_adm: [
                                                {
                                                    comment: 'removed by api',
                                                    subject: `user:${requestedBy.userId}`,
                                                },
                                            ],
                                        },
                                        modified: {},
                                    },
                                },
                            },
                        );
                    }),
                );
            }

            return entries;
        });

        ctx.log(BiTrackingLogs.PrivateCreateEntry, {
            entryId: result && !Array.isArray(result) ? Utils.encodeId(result.entryId) : null,
        });

        return result;
    }

    static async resolveTenantIdByEntryId(
        {requestId, tenantId, entryId, requestedBy}: MT.ResolveTenantIdByEntryIdConfig,
        ctx: MT.CTX,
    ) {
        ctx.log('RESOLVE_TENANT_ID_BY_ENTRY_ID_REQUEST', {
            requestId,
            tenantId,
            entryId,
            requestedBy,
        });

        const {isValid, validationErrors} = validateResolveTenantIdByEntryId({entryId});

        if (!isValid) {
            throw new AppError('Validation error', {
                code: US_ERRORS.VALIDATION_ERROR,
                details: {validationErrors},
            });
        }

        const result = await Entry.query(this.replica)
            .select('tenantId')
            .where({
                entryId,
            })
            .first()
            .timeout(Model.DEFAULT_QUERY_TIMEOUT);

        if (!result) {
            throw new AppError('NOT_EXIST_ENTRY', {
                code: 'NOT_EXIST_ENTRY',
            });
        }

        ctx.log('RESOLVE_TENANT_ID_BY_ENTRY_ID_SUCCESS');

        return result;
    }

    static async checkExistenceEntriesWithInsufficientPermissions({
        permission,
        entries,
        ctx,
        trx,
    }: MT.CheckExistenceEntriesWithInsufficientPermissions): Promise<boolean> {
        const {DLS} = registry.common.classes.get();

        const entriesWithPermissionsInfo = await DLS.checkBulkPermission(
            {ctx, trx},
            {
                entities: entries,
                action: MT.DlsActions.Read,
                includePermissionsInfo: true,
            },
        );

        const foundInsufficientPermission = entriesWithPermissionsInfo
            .map(({permissions = {}}: MT.DlsEntity) => permissions)
            .find((permissions: MT.UsPermission) => !permissions[permission]);

        return Boolean(foundInsufficientPermission);
    }
}

export default Entry;
