import {TransactionOrKnex} from 'objection';

import {
    AccessServicePermissionDeniedError,
    CollectionEntryCannotBeMigratedToWorkbookError,
    EntriesWithDifferentWorkbookIdsCopyDeniedError,
    EntryWithoutWorkbookIdCopyDeniedError,
    FolderCopyDeniedError,
    NotExistEntryError,
    WorkbookCopyFileConnectionError,
    WorkbookEntryCannotBeMigratedToWorkbookError,
    WorkbookNotExistsError,
} from '../../../components/errors';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {BiTrackingLogs} from '../../../const';
import Link from '../../../db/models/links';
import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import {
    JoinedEntryRevision,
    type JoinedEntryRevisionColumns,
} from '../../../db/presentations/joined-entry-revision';
import {WorkbookPermission} from '../../../entities/workbook';
import {CTX, UsPermissions} from '../../../types/models';
import Utils, {makeUserId} from '../../../utils';
import {getParentIds} from '../../new/collection/utils/get-parents';
import {checkEntriesByPermission} from '../../new/entry/utils/check-entries-by-permission';
import {resolveEntriesNameCollisions} from '../../new/entry/utils/resolveNameCollisions';

interface Params {
    entryIds: Entry['entryId'][];
    destinationWorkbookId: WorkbookModel['workbookId'];
    tenantIdOverride?: Entry['tenantId'];
    trxOverride?: TransactionOrKnex;
    skipLinkSync?: boolean;
    skipWorkbookPermissionsCheck?: boolean;
    entryPermission?: UsPermissions;
    resolveNameCollisions?: boolean;
    isMigrateCopiedEntries?: boolean;
}

export const validateParams = makeSchemaValidator({
    type: 'object',
    required: ['entryIds', 'destinationWorkbookId'],
    properties: {
        entryIds: {
            type: 'array',
            items: {type: 'string'},
        },
        destinationWorkbookId: {
            type: 'string',
        },
        tenantIdOverride: {
            type: 'string',
        },
        skipLinkSync: {
            type: 'boolean',
        },
        skipWorkbookPermissionsCheck: {
            type: 'boolean',
        },
        entryPermission: {
            type: 'string',
        },
        resolveNameCollisions: {
            type: 'boolean',
        },
        isMigrateCopiedEntries: {
            type: 'boolean',
        },
    },
});

const checkSourceEntriesPermissions = async ({
    ctx,
    trxOverride,
    entries,
    permission,
}: {
    ctx: CTX;
    trxOverride?: TransactionOrKnex;
    entries: JoinedEntryRevisionColumns[];
    permission: UsPermissions;
}) => {
    const chunkSize = 1000;

    for (let index = 0; index < entries.length; index += chunkSize) {
        const checkedEntries = await checkEntriesByPermission(
            {ctx, trx: trxOverride},
            {
                entries: entries.slice(index, index + chunkSize),
                permission,
            },
        );

        if (checkedEntries.some(({isLocked}) => isLocked)) {
            throw new AccessServicePermissionDeniedError();
        }
    }
};

export const copyToWorkbook = async (ctx: CTX, params: Params) => {
    const {
        entryIds,
        destinationWorkbookId,
        tenantIdOverride,
        trxOverride,
        skipLinkSync,
        skipWorkbookPermissionsCheck = false,
        entryPermission,
        resolveNameCollisions,
        isMigrateCopiedEntries,
    } = params;

    ctx.log('COPY_ENTRY_TO_WORKBOOK_CALL', {
        entryIds: await Utils.macrotasksMap(entryIds, (entryId) => Utils.encodeId(entryId)),
        destinationWorkbookId: Utils.encodeId(destinationWorkbookId),
        tenantIdOverride,
    });

    validateParams(params);

    const {tenantId, user} = ctx.get('info');
    const registry = ctx.get('registry');
    const {getId} = registry.getDbInstance();
    const createdBy = makeUserId(user.userId);

    const targetTenantId = tenantIdOverride ?? tenantId;

    const transactionTrx = trxOverride ?? Entry.primary;

    const originJoinedEntryRevisions = await JoinedEntryRevision.find({
        where: (builder) => {
            builder.where({
                [`${Entry.tableName}.${EntryColumn.IsDeleted}`]: false,
            });

            builder.whereIn(`${Entry.tableName}.${EntryColumn.EntryId}`, entryIds);
        },
        trx: Entry.replica,
    });

    if (originJoinedEntryRevisions.length === 0) {
        throw new NotExistEntryError({message: "Entries don't exist"});
    }

    let workbookId: Optional<string>;
    originJoinedEntryRevisions.forEach((joinedEntryRevision) => {
        if (tenantIdOverride === undefined && joinedEntryRevision.tenantId !== tenantId) {
            throw new NotExistEntryError({
                message: `Entry ${Utils.encodeId(joinedEntryRevision.entryId)} doesn't exist`,
            });
        }

        if (joinedEntryRevision.scope === 'folder') {
            throw new FolderCopyDeniedError();
        }

        if (isMigrateCopiedEntries) {
            if (joinedEntryRevision.collectionId !== null) {
                throw new CollectionEntryCannotBeMigratedToWorkbookError({
                    message: `Entry ${Utils.encodeId(
                        joinedEntryRevision.entryId,
                    )} cannot be migrated to workbook because it belongs to collection ${Utils.encodeId(
                        joinedEntryRevision.collectionId,
                    )}`,
                });
            }

            if (joinedEntryRevision.workbookId !== null) {
                throw new WorkbookEntryCannotBeMigratedToWorkbookError({
                    message: `Entry ${Utils.encodeId(
                        joinedEntryRevision.entryId,
                    )} cannot be migrated to workbook because it belongs to workbook ${Utils.encodeId(
                        joinedEntryRevision.workbookId,
                    )}`,
                });
            }
        } else {
            if (joinedEntryRevision.workbookId === null) {
                throw new EntryWithoutWorkbookIdCopyDeniedError({
                    message: `Entry ${Utils.encodeId(
                        joinedEntryRevision.entryId,
                    )} doesn't have a workbookId and cannot be copied to a workbook.`,
                });
            }

            if (workbookId === undefined) {
                workbookId = joinedEntryRevision.workbookId;
            } else if (joinedEntryRevision.workbookId !== workbookId) {
                throw new EntriesWithDifferentWorkbookIdsCopyDeniedError({
                    message: `Copying entries from different workbooks is denied – ${Utils.encodeId(
                        workbookId,
                    )} and ${Utils.encodeId(joinedEntryRevision.workbookId)}`,
                });
            }
        }

        const isFileConnection = Utils.isFileConnection(joinedEntryRevision);

        if (isFileConnection) {
            throw new WorkbookCopyFileConnectionError({
                message: `Entry ${Utils.encodeId(
                    joinedEntryRevision.entryId,
                )} is a file connection and cannot be copied to a workbook.`,
            });
        }
    });

    if (workbookId === undefined && !isMigrateCopiedEntries) {
        throw new EntryWithoutWorkbookIdCopyDeniedError({
            message: `Entries don't have a workbookId and cannot be copied to a workbook.`,
        });
    }

    if (entryPermission) {
        await checkSourceEntriesPermissions({
            ctx,
            trxOverride,
            entries: originJoinedEntryRevisions,
            permission: entryPermission,
        });
    }

    let entryNamesOverride = new Map<string, string>();

    if (resolveNameCollisions) {
        const targetWorkbookEntries = await Entry.query(Entry.replica)
            .select()
            .where(EntryColumn.WorkbookId, destinationWorkbookId)
            .andWhere({
                [EntryColumn.TenantId]: tenantId,
                [EntryColumn.IsDeleted]: false,
            })
            .orderBy(EntryColumn.SortName, 'asc')
            .timeout(Entry.DEFAULT_QUERY_TIMEOUT);

        entryNamesOverride = resolveEntriesNameCollisions({
            existingEntries: targetWorkbookEntries,
            addingEntries: originJoinedEntryRevisions,
        });
    }

    const mapEntryIdsWithOldIds = new Map<string, string>();

    const newEntries = await Promise.all(
        originJoinedEntryRevisions.map(async (originJoinedEntryRevision) => {
            const [newEntryId, newRevId] = await Promise.all([getId(), getId()]);

            mapEntryIdsWithOldIds.set(newEntryId, originJoinedEntryRevision.entryId);

            const name =
                entryNamesOverride?.get(originJoinedEntryRevision.entryId) ??
                Utils.getNameByKey({
                    key: originJoinedEntryRevision.displayKey,
                });
            const displayKey = `${newEntryId}/${name}`;
            const key = displayKey.toLowerCase();

            const links = originJoinedEntryRevision.links as Nullable<Record<string, string>>;

            if (!skipLinkSync && links) {
                await Link.sync({entryId: newEntryId, links, ctx, trxOverride: transactionTrx});
            }

            return {
                scope: originJoinedEntryRevision.scope,
                type: originJoinedEntryRevision.type,
                key,
                innerMeta: null,
                createdBy: createdBy,
                updatedBy: createdBy,
                deletedAt: null,
                hidden: originJoinedEntryRevision.hidden,
                displayKey,
                entryId: newEntryId,
                savedId: newRevId,
                publishedId: originJoinedEntryRevision.publishedId ? newRevId : null,
                tenantId: targetTenantId,
                unversionedData: originJoinedEntryRevision.unversionedData,
                workbookId: destinationWorkbookId,
                revisions: [
                    {
                        data: originJoinedEntryRevision.data,
                        meta: originJoinedEntryRevision.meta,
                        annotation: originJoinedEntryRevision.annotation,
                        createdBy: createdBy,
                        updatedBy: createdBy,
                        revId: newRevId,
                        entryId: newEntryId,
                        links,
                    },
                ],
            };
        }),
    );

    if (!skipWorkbookPermissionsCheck) {
        const workbookTargetTrx = trxOverride ?? WorkbookModel.replica;
        const {Workbook} = registry.common.classes.get();

        const destinationWorkbookModel: Optional<WorkbookModel> = await WorkbookModel.query(
            workbookTargetTrx,
        )
            .findById(destinationWorkbookId)
            .where({[WorkbookModelColumn.DeletedAt]: null})
            .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

        if (destinationWorkbookModel === undefined) {
            throw new WorkbookNotExistsError();
        }

        if (workbookId) {
            const originWorkbookModel = await WorkbookModel.query(workbookTargetTrx)
                .findById(workbookId)
                .where({[WorkbookModelColumn.DeletedAt]: null})
                .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

            if (originWorkbookModel === undefined) {
                throw new WorkbookNotExistsError();
            }

            if (tenantIdOverride === undefined && originWorkbookModel.tenantId !== tenantId) {
                throw new WorkbookNotExistsError();
            }

            if (tenantIdOverride === undefined) {
                const originWorkbook = new Workbook({
                    ctx,
                    model: originWorkbookModel,
                });

                let originWorkbookParentIds: string[] = [];

                if (originWorkbook.model.collectionId !== null) {
                    originWorkbookParentIds = await getParentIds({
                        ctx,
                        collectionId: originWorkbook.model.collectionId,
                    });
                }

                await originWorkbook.checkPermission({
                    parentIds: originWorkbookParentIds,
                    permission: WorkbookPermission.Copy,
                });
            }
        }

        const destinationWorkbook = new Workbook({
            ctx,
            model: destinationWorkbookModel,
        });

        let destinationWorkbookParentIds: string[] = [];

        if (destinationWorkbook.model.collectionId !== null) {
            destinationWorkbookParentIds = await getParentIds({
                ctx,
                collectionId: destinationWorkbook.model.collectionId,
            });
        }

        await destinationWorkbook.checkPermission({
            parentIds: destinationWorkbookParentIds,
            permission: WorkbookPermission.Update,
        });
    }

    await Entry.query(transactionTrx).insertGraph(newEntries).timeout(Entry.DEFAULT_QUERY_TIMEOUT);

    const copiedJoinedEntryRevisions = await JoinedEntryRevision.find({
        where: (builder) => {
            builder.where({
                [`${Entry.tableName}.tenantId`]: targetTenantId,
                [`${Entry.tableName}.isDeleted`]: false,
            });

            builder.whereIn(`${Entry.tableName}.entryId`, Array.from(mapEntryIdsWithOldIds.keys()));
        },
        trx: transactionTrx,
    });

    const result = copiedJoinedEntryRevisions.map((entry: {entryId: string}) => {
        return {
            newJoinedEntryRevision: entry,
            oldEntryId: mapEntryIdsWithOldIds.get(entry.entryId),
        };
    });

    result.forEach(({newJoinedEntryRevision}) => {
        ctx.log(BiTrackingLogs.CopyEntry, {
            entryId: Utils.encodeId(newJoinedEntryRevision.entryId),
        });
    });

    return result;
};
