import {TransactionOrKnex} from 'objection';
import {AppError} from '@gravity-ui/nodekit';

import {getId} from '../../../db';
import {Entry} from '../../../db/models/new/entry';
import {JoinedEntryRevision} from '../../../db/presentations/joined-entry-revision';
import {WorkbookModel} from '../../../db/models/new/workbook';
import {CTX} from '../../../types/models';
import {US_ERRORS, BiTrackingLogs} from '../../../const';
import Utils, {logInfo, makeUserId} from '../../../utils';
import {registry} from '../../../registry';
import {WorkbookPermission} from '../../../entities/workbook';
import {getParentIds} from '../../new/collection/utils/get-parents';

import Link from '../../../db/models/links';

import {makeSchemaValidator} from '../../../components/validation-schema-compiler';

interface Params {
    entryIds: Entry['entryId'][];
    destinationWorkbookId: WorkbookModel['workbookId'];
    tenantIdOverride?: Entry['tenantId'];
    trxOverride?: TransactionOrKnex;
    skipLinkSync?: boolean;
    skipWorkbookPermissionsCheck?: boolean;
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
    },
});

export const copyToWorkbook = async (ctx: CTX, params: Params) => {
    const {
        entryIds,
        destinationWorkbookId,
        tenantIdOverride,
        trxOverride,
        skipLinkSync,
        skipWorkbookPermissionsCheck = false,
    } = params;

    logInfo(ctx, 'COPY_ENTRY_TO_WORKBOOK_CALL', {
        entryIds: entryIds.map((entryId) => Utils.encodeId(entryId)),
        destinationWorkbookId,
        tenantIdOverride,
    });

    validateParams(params);

    const {tenantId, user} = ctx.get('info');
    const createdBy = makeUserId(user.userId);

    const targetTenantId = tenantIdOverride ?? tenantId;

    const transactionTrx = trxOverride ?? Entry.primary;

    const originJoinedEntryRevisions = await JoinedEntryRevision.find({
        where: (builder) => {
            builder.where({
                [`${Entry.tableName}.isDeleted`]: false,
            });

            builder.whereIn(`${Entry.tableName}.entryId`, entryIds);
        },
        joinRevisionArgs: {
            isPublishFallback: true,
        },
        trx: Entry.replica,
    });

    if (originJoinedEntryRevisions.length === 0) {
        throw new AppError("Entries don't exist", {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
    }

    let workbookId: Optional<string>;
    originJoinedEntryRevisions.forEach((joinedEntryRevision) => {
        if (tenantIdOverride === undefined && joinedEntryRevision.tenantId !== tenantId) {
            throw new AppError(
                `Entry ${Utils.encodeId(joinedEntryRevision.entryId)} doesn't exist`,
                {
                    code: US_ERRORS.NOT_EXIST_ENTRY,
                },
            );
        }

        if (joinedEntryRevision.scope === 'folder') {
            throw new AppError('Folders cannot be copied', {
                code: US_ERRORS.FOLDER_COPY_DENIED,
            });
        }

        if (joinedEntryRevision.workbookId === null) {
            throw new AppError(
                `Entry ${Utils.encodeId(
                    joinedEntryRevision.entryId,
                )} doesn't have a workbookId and cannot be copied to a workbook.`,
                {
                    code: US_ERRORS.ENTRY_WITHOUT_WORKBOOK_ID_COPY_DENIED,
                },
            );
        }

        if (workbookId === undefined) {
            workbookId = joinedEntryRevision.workbookId;
        } else if (joinedEntryRevision.workbookId !== workbookId) {
            throw new AppError(
                `Copying entries from different workbooks is denied – ${Utils.encodeId(
                    workbookId,
                )} and ${Utils.encodeId(joinedEntryRevision.workbookId)}`,
                {
                    code: US_ERRORS.ENTRIES_WITH_DIFFERENT_WORKBOOK_IDS_COPY_DENIED,
                },
            );
        }
    });

    if (workbookId === undefined) {
        throw new AppError(`Entries don't have a workbookId and cannot be copied to a workbook.`, {
            code: US_ERRORS.ENTRY_WITHOUT_WORKBOOK_ID_COPY_DENIED,
        });
    }

    const mapEntryIdsWithOldIds = new Map<string, string>();

    const newEntries = await Promise.all(
        originJoinedEntryRevisions.map(async (originJoinedEntryRevision) => {
            const [newEntryId, newRevId] = await Promise.all([getId(), getId()]);

            mapEntryIdsWithOldIds.set(newEntryId, originJoinedEntryRevision.entryId);

            const displayKey = `${newEntryId}/${Utils.getNameByKey({
                key: originJoinedEntryRevision.displayKey,
            })}`;
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

        const [originWorkbookModel, destinationWorkbookModel]: Optional<WorkbookModel>[] =
            await Promise.all([
                WorkbookModel.query(workbookTargetTrx)
                    .findById(workbookId)
                    .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT),
                WorkbookModel.query(workbookTargetTrx)
                    .findById(destinationWorkbookId)
                    .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT),
            ]);

        if (originWorkbookModel === undefined || destinationWorkbookModel === undefined) {
            throw new AppError('Workbook not exists', {
                code: US_ERRORS.WORKBOOK_NOT_EXISTS,
            });
        }

        if (tenantIdOverride === undefined && originWorkbookModel.tenantId !== tenantId) {
            throw new AppError('Workbook not exists', {
                code: US_ERRORS.WORKBOOK_NOT_EXISTS,
            });
        }
        const {Workbook} = registry.common.classes.get();

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
        joinRevisionArgs: {
            isPublishFallback: true,
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
        logInfo(ctx, BiTrackingLogs.CopyEntry, {
            entryId: Utils.encodeId(newJoinedEntryRevision.entryId),
        });
    });

    return result;
};
