import {TransactionOrKnex} from 'objection';
import {AppError} from '@gravity-ui/nodekit';

import {getId} from '../../../db';
import {Entry} from '../../../db/models/new/entry';
import {JoinedEntryRevision} from '../../../db/presentations/joined-entry-revision';
import {WorkbookModel} from '../../../db/models/new/workbook';
import {CTX} from '../../../types/models';
import {US_ERRORS, BiTrackingLogs} from '../../../const';
import Utils, {logInfo, makeUserId} from '../../../utils';

import Link from '../../../db/models/links';

import {makeSchemaValidator} from '../../../components/validation-schema-compiler';

interface Params {
    entryIds: Entry['entryId'][];
    destinationWorkbookId: WorkbookModel['workbookId'];
    tenantIdOverride?: Entry['tenantId'];
    trxOverride?: TransactionOrKnex;
    skipLinkSync?: boolean;
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
    },
});

export const copyToWorkbook = async (ctx: CTX, params: Params) => {
    const {entryIds, destinationWorkbookId, tenantIdOverride, trxOverride, skipLinkSync} = params;

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
        },
        whereIn: {columnName: `${Entry.tableName}.entryId`, values: entryIds},
        joinRevisionArgs: {
            isPublishFallback: true,
        },
        trx: Entry.replica,
    });

    const mapEntryIdsWithOldIds = new Map<string, string>();

    const newEntries = await Promise.all(
        originJoinedEntryRevisions.map(async (originJoinedEntryRevision) => {
            if (originJoinedEntryRevision === undefined) {
                throw new AppError('Entry not exists', {
                    code: US_ERRORS.NOT_EXIST_ENTRY,
                });
            }

            if (tenantIdOverride === undefined && originJoinedEntryRevision.tenantId !== tenantId) {
                throw new AppError('Entry not exists', {
                    code: US_ERRORS.NOT_EXIST_ENTRY,
                });
            }

            if (originJoinedEntryRevision.workbookId === null) {
                throw new AppError("Entry without workbookId, can't be copied to workbook", {
                    code: US_ERRORS.ENTRY_WITHOUT_WORKBOOK_ID_COPY_DENIED,
                });
            }

            if (originJoinedEntryRevision.scope === 'folder') {
                throw new AppError('Folders cannot be copied', {
                    code: US_ERRORS.FOLDER_COPY_DENIED,
                });
            }

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

    await Entry.query(transactionTrx).insertGraph(newEntries).timeout(Entry.DEFAULT_QUERY_TIMEOUT);

    const copiedJoinedEntryRevisions = await JoinedEntryRevision.find({
        where: {
            [`${Entry.tableName}.tenantId`]: targetTenantId,
            [`${Entry.tableName}.isDeleted`]: false,
        },
        whereIn: {
            columnName: `${Entry.tableName}.entryId`,
            values: Array.from(mapEntryIdsWithOldIds.keys()),
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
