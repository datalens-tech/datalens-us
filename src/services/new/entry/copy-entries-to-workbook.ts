import {transaction} from 'objection';

import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {JoinedEntryRevisionColumns} from '../../../db/presentations';
import Utils, {makeUserId} from '../../../utils';
import {copyToWorkbook} from '../../entry/actions';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';
import {crossSyncCopiedJoinedEntryRevisions} from '../workbook';

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

    ctx.log('COPY_ENTRIES_TO_WORKBOOK_START', {
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

    ctx.log('COPY_ENTRIES_TO_WORKBOOK_FINISH');

    return {
        workbookId: targetWorkbookId,
    };
};
