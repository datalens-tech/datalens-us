import {TransactionOrKnex} from 'objection';
import {AppError} from '@gravity-ui/nodekit';

import {getId} from '../../../db';
import {Entry} from '../../../db/models/new/entry';
import {JoinedEntryRevision} from '../../../db/presentations/joined-entry-revision';
import {WorkbookModel} from '../../../db/models/new/workbook';
import Link from '../../../db/models/links';
import {CTX} from '../../../types/models';
import {US_ERRORS, BiTrackingLogs} from '../../../const';
import Utils, {logInfo, makeUserId} from '../../../utils';

import {makeSchemaValidator} from '../../../components/validation-schema-compiler';

interface Params {
    entryId: Entry['entryId'];
    destinationWorkbookId: WorkbookModel['workbookId'];
    tenantIdOverride?: Entry['tenantId'];
    skipWorkbookPermissionsCheck?: boolean;
    trxOverride?: TransactionOrKnex;
}

export const validateParams = makeSchemaValidator({
    type: 'object',
    required: ['entryId', 'destinationWorkbookId'],
    properties: {
        entryId: {
            type: 'string',
        },
        destinationWorkbookId: {
            type: 'string',
        },
        tenantIdOverride: {
            type: 'string',
        },
        skipWorkbookPermissionsCheck: {
            type: 'boolean',
        },
    },
});

export const copyToWorkbook = async (ctx: CTX, params: Params) => {
    const {entryId, destinationWorkbookId, tenantIdOverride, trxOverride} = params;

    logInfo(ctx, 'COPY_ENTRY_TO_WORKBOOK_CALL', {
        entryId: Utils.encodeId(entryId),
        destinationWorkbookId,
        tenantIdOverride,
    });

    validateParams(params);

    const {tenantId, user} = ctx.get('info');
    const createdBy = makeUserId(user.userId);

    const targetTenantId = tenantIdOverride ?? tenantId;

    const originJoinedEntryRevision = await JoinedEntryRevision.findOne({
        where: {
            [`${Entry.tableName}.entryId`]: entryId,
            [`${Entry.tableName}.isDeleted`]: false,
        },
        joinRevisionArgs: {
            isPublishFallback: true,
        },
        trx: Entry.replica,
    });

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

    const transactionTrx = trxOverride ?? Entry.primary;

    // const newJoinedEntryRevision =
    const [newEntryId, newRevId] = await Promise.all([getId(), getId()]);

    const displayKey = `${newEntryId}/${Utils.getNameByKey({
        key: originJoinedEntryRevision.displayKey,
    })}`;
    const key = displayKey.toLowerCase();

    const links = originJoinedEntryRevision.links as Nullable<Record<string, string>>;
    if (links) {
        await Link.sync({entryId: newEntryId, links, ctx, trxOverride: transactionTrx});
    }

    await Entry.query(transactionTrx)
        .insertGraph({
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
        })
        .timeout(Entry.DEFAULT_QUERY_TIMEOUT);

    const copiedJoinedEntryRevision = await JoinedEntryRevision.findOne({
        where: {
            [`${Entry.tableName}.entryId`]: newEntryId,
            [`${Entry.tableName}.tenantId`]: targetTenantId,
            [`${Entry.tableName}.isDeleted`]: false,
        },
        joinRevisionArgs: {
            isPublishFallback: true,
        },
        trx: transactionTrx,
    });

    logInfo(ctx, BiTrackingLogs.CopyEntry, {
        entryId: Utils.encodeId(entryId),
    });

    return copiedJoinedEntryRevision;
};
