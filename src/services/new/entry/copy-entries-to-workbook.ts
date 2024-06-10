import {ServiceArgs} from '../types';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import Utils, {logInfo, makeUserId} from '../../../utils';
import {crossSyncCopiedJoinedEntryRevisions} from '../workbook';
import {transaction} from 'objection';
import {getPrimary} from '../utils';
import {copyToWorkbook} from '../../entry/actions';
import {JoinedEntryRevisionColumns} from '../../../db/presentations';

export type CopyEntriesToWorkbookParams = {
    entryIds: string[];
    workbookId: string;
    isMigrateCopiedEntries?: boolean;
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
        isMigrateCopiedEntries: {
            type: 'boolean',
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

    const {entryIds, workbookId: targetWorkbookId, isMigrateCopiedEntries} = args;
    const {user} = ctx.get('info');
    const updatedBy = makeUserId(user.userId);

    logInfo(ctx, 'COPY_ENTRIES_TO_WORKBOOK_START', {
        entryIds: await Utils.macrotasksMap(entryIds, (entryId) => Utils.encodeId(entryId)),
        workbookId: Utils.encodeId(targetWorkbookId),
        copiedBy: updatedBy,
    });

    await transaction(getPrimary(trx), async (transactionTrx) => {
        const copiedJoinedEntryRevisions = await copyToWorkbook(ctx, {
            entryIds,
            destinationWorkbookId: targetWorkbookId,
            trxOverride: transactionTrx,
            skipLinkSync: true,
            skipWorkbookPermissionsCheck: skipCheckPermissions,
            resolveNameCollisions: true,
            isMigrateCopiedEntries,
        });

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
