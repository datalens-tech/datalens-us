import {transaction, raw} from 'objection';
import {AppError} from '@gravity-ui/nodekit';
import {ServiceArgs} from '../types';
import {getReplica, getPrimary} from '../utils';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import Utils, {logInfo} from '../../../utils';
import {Entry, EntryColumn} from '../../../db/models/new/entry';

import {US_ERRORS, CURRENT_TIMESTAMP, DEFAULT_QUERY_TIMEOUT, TRASH_FOLDER} from '../../../const';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['workbookId'],
    properties: {
        workbookId: {
            type: 'string',
        },
    },
});

export interface RestoreWorkbookArgs {
    workbookId: string;
}

export const restoreWorkbook = async (
    {ctx, trx, skipValidation = false}: ServiceArgs,
    args: RestoreWorkbookArgs,
) => {
    const {workbookId} = args;

    logInfo(ctx, 'RESTORE_WORKBOOK_START', {
        workbookId: Utils.encodeId(workbookId),
    });

    if (!skipValidation) {
        validateArgs(args);
    }

    const {tenantId} = ctx.get('info');

    const targetTrx = getReplica(trx);

    const model: Optional<WorkbookModel> = await WorkbookModel.query(targetTrx)
        .skipUndefined()
        .select()
        .where({
            [WorkbookModelColumn.TenantId]: tenantId,
            [WorkbookModelColumn.WorkbookId]: workbookId,
        })
        .andWhereNot(WorkbookModelColumn.DeletedAt, null)
        .first()
        .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

    if (!model) {
        throw new AppError(US_ERRORS.WORKBOOK_NOT_EXISTS, {
            code: US_ERRORS.WORKBOOK_NOT_EXISTS,
        });
    }

    console.log('modelasd: ', model);

    const entries = await Entry.query(targetTrx)
        .skipUndefined()
        .select()
        .where({
            [EntryColumn.WorkbookId]: workbookId,
            [EntryColumn.TenantId]: tenantId,
            [EntryColumn.IsDeleted]: true,
        })
        .timeout(Entry.DEFAULT_QUERY_TIMEOUT);

    console.log('etrniess: ', entries);

    const primaryTrx = getPrimary(trx);

    const result = await transaction(primaryTrx, async (transactionTrx) => {
        const restoredWorkbook = await WorkbookModel.query(transactionTrx)
            .skipUndefined()
            .patch({
                [WorkbookModelColumn.DeletedBy]: null,
                [WorkbookModelColumn.DeletedAt]: raw(CURRENT_TIMESTAMP),
                [WorkbookModelColumn.UpdatedAt]: raw(CURRENT_TIMESTAMP),
            })
            .where({
                [WorkbookModelColumn.WorkbookId]: model.workbookId,
                [WorkbookModelColumn.TenantId]: tenantId,
            })
            .returning('*')
            .first()
            .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

        await Promise.all(
            entries.map(async (entry) => {
                const {entryId, displayKey, key} = entry;

                const newInnerMeta = {
                    ...entry.innerMeta,
                    oldKey: key as string,
                    oldDisplayKey: displayKey as string,
                };

                Entry.query(trx)
                    .skipUndefined()
                    .patch({
                        key: key?.replace(TRASH_FOLDER, ''),
                        displayKey: displayKey?.replace(TRASH_FOLDER, ''),
                        innerMeta: newInnerMeta,
                        isDeleted: false,
                        deletedAt: null,
                        updatedAt: raw(CURRENT_TIMESTAMP),
                    })
                    .where({
                        entryId,
                    })
                    .timeout(DEFAULT_QUERY_TIMEOUT);
            }),
        );

        return restoredWorkbook;
    });

    if (!result) {
        throw new AppError(US_ERRORS.WORKBOOK_NOT_EXISTS, {
            code: US_ERRORS.WORKBOOK_NOT_EXISTS,
        });
    }

    ctx.log('RESTORE_WORKBOOK_FINISH', {
        workbookId: Utils.encodeId(workbookId),
    });

    return result;
};
