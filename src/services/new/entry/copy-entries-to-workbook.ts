import {ServiceArgs} from '../types';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import Utils, {logInfo, makeUserId} from '../../../utils';
import {crossSyncCopiedJoinedEntryRevisions, getWorkbook} from '../workbook';
import {Entry, EntryScope, EntryType, EntryColumn} from '../../../db/models/new/entry';
import {AppError} from '@gravity-ui/nodekit';
import {US_ERRORS} from '../../../const';
import {transaction} from 'objection';
import {getPrimary, getReplica} from '../utils';
import {checkWorkbookPermission} from '../workbook/utils/check-workbook-permission';
import {WorkbookPermission} from '../../../entities/workbook';
import {resolveEntriesNameCollisions} from './utils/resolveNameCollisions';
import { copyToWorkbook } from '../../entry/actions';
import { JoinedEntryRevisionColumns } from '../../../db/presentations';

export type CopyEntriesToWorkbookParams = {
    entryIds: string[];
    workbookId: string;
};

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['entryIds', 'workbookId'],
    properties: {
        entryIds: {
            type: 'array',
            items: {
                type: 'string',
            },
        },
        workbookId: {
            type: 'string',
        },
    },
});

export const copyEntriesToWorkbook = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: CopyEntriesToWorkbookParams,
) => {
    if (!skipValidation) {
        validateArgs(args);
    }

    const {entryIds, workbookId: targetWorkbookId} = args;
    const {tenantId, user} = ctx.get('info');
    const updatedBy = makeUserId(user.userId);

    logInfo(ctx, 'COPY_ENTRIES_TO_WORKBOOK_START', {
        entryIds: entryIds.map((entryId) => Utils.encodeId(entryId)),
        workbookId: Utils.encodeId(targetWorkbookId),
        copiedBy: updatedBy,
    });

    if (entryIds.length === 0) {
        throw new AppError(US_ERRORS.VALIDATION_ERROR, {
            code: US_ERRORS.VALIDATION_ERROR,
        });
    }

    const entries = await Entry.query(Entry.replica)
        .select()
        .whereIn(EntryColumn.EntryId, entryIds)
        .andWhere({
            [EntryColumn.TenantId]: tenantId,
            [EntryColumn.IsDeleted]: false,
        })
        .timeout(Entry.DEFAULT_QUERY_TIMEOUT);

    // File connections are not supported at the moment.
    const entriesToCopy = entries.filter((entry) => {
        const isConnection = entry.scope === EntryScope.Connection;
        const isFile = entry.type === EntryType.File || entry.type === EntryType.GsheetsV2;

        return (isConnection && isFile) === false;
    });

    logInfo(ctx, 'ENTRIES_TO_COPY', {
        entryIds: entriesToCopy.map(({entryId}) => Utils.encodeId(entryId)),
    });

    if (entriesToCopy.length === 0) {
        throw new AppError(US_ERRORS.VALIDATION_ERROR, {
            code: US_ERRORS.VALIDATION_ERROR,
        });
    }

    const sourceEntry = entriesToCopy[0];

    if (!sourceEntry.workbookId) {
        throw new AppError(US_ERRORS.ENTRY_IS_NOT_IN_WORKBOOK, {
            code: US_ERRORS.ENTRY_IS_NOT_IN_WORKBOOK,
        });
    }

    if (entriesToCopy.some(({workbookId}) => workbookId !== sourceEntry.workbookId)) {
        throw new AppError(US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED, {
            code: US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED,
        });
    }

    const [sourceWorkbook, targetWorkbook] = await Promise.all([
        getWorkbook(
            {ctx, skipValidation: true, skipCheckPermissions: true},
            {workbookId: sourceEntry.workbookId},
        ),
        getWorkbook(
            {ctx, skipValidation: true, skipCheckPermissions: true},
            {workbookId: targetWorkbookId},
        ),
    ]);

    if (!skipCheckPermissions) {
        logInfo(ctx, 'CHECK_ACCESS_TO_SOURCE_WORKBOOK', {
            workbookId: Utils.encodeId(sourceWorkbook.model.workbookId),
        });

        await checkWorkbookPermission({
            ctx,
            trx,
            workbook: sourceWorkbook,
            permission: WorkbookPermission.View,
        });

        logInfo(ctx, 'CHECK_ACCESS_TO_TARGET_WORKBOOK', {
            workbookId: Utils.encodeId(targetWorkbookId),
        });

        await checkWorkbookPermission({
            ctx,
            trx,
            workbook: targetWorkbook,
            permission: WorkbookPermission.Update,
        });
    }

    const targetWorkbookEntries = await Entry.query(getReplica(trx))
        .select()
        .where(EntryColumn.WorkbookId, targetWorkbookId)
        .andWhere({
            [EntryColumn.TenantId]: tenantId,
            [EntryColumn.IsDeleted]: false,
        })
        .orderBy(EntryColumn.SortName, 'asc')
        .timeout(Entry.DEFAULT_QUERY_TIMEOUT);

    const nonCollisionAddingEntriesNames = resolveEntriesNameCollisions({
        existingEntries: targetWorkbookEntries,
        addingEntries: entriesToCopy,
    });

    await transaction(getPrimary(trx), async (transactionTrx) => {
        const copiedJoinedEntryRevisions = await copyToWorkbook(
            ctx,
            {
                entryIds: entriesToCopy.map(({entryId}) => entryId),
                destinationWorkbookId: targetWorkbookId,
                trxOverride: transactionTrx,
                skipWorkbookPermissionsCheck: true,
                skipLinkSync: true,
                entryNamesOverride: nonCollisionAddingEntriesNames,
            }
        );

        const filteredCopiedJoinedEntryRevisions = copiedJoinedEntryRevisions.filter(
            (item) => item.newJoinedEntryRevision !== undefined,
        ) as {
            newJoinedEntryRevision: JoinedEntryRevisionColumns;
            oldEntryId: string;
        }[];

        await crossSyncCopiedJoinedEntryRevisions({
            copiedJoinedEntryRevisions: filteredCopiedJoinedEntryRevisions,
            ctx,
            trx: transactionTrx,
        });
    });

    logInfo(ctx, 'COPY_ENTRIES_TO_WORKBOOK_FINISH');

    return {
        workbookId: targetWorkbookId,
    };
};
