import {AppError} from '@gravity-ui/nodekit';
import {raw, transaction} from 'objection';

import {CURRENT_TIMESTAMP, DEFAULT_QUERY_TIMEOUT, TRASH_FOLDER, US_ERRORS} from '../../../const';
import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getPrimary, getReplica} from '../utils';

export interface RestoreWorkbookArgs {
    workbookId: string;
}

export const restoreWorkbook = async ({ctx, trx}: ServiceArgs, args: RestoreWorkbookArgs) => {
    const {workbookId} = args;

    ctx.log('RESTORE_WORKBOOK_START', {
        workbookId: Utils.encodeId(workbookId),
    });

    const {tenantId, isPrivateRoute} = ctx.get('info');

    const targetTrx = getReplica(trx);

    const model = await WorkbookModel.query(targetTrx)
        .select()
        .where({
            [WorkbookModelColumn.WorkbookId]: workbookId,
            ...(isPrivateRoute ? {} : {[WorkbookModelColumn.TenantId]: tenantId}),
        })
        .first()
        .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

    if (!model) {
        throw new AppError(US_ERRORS.WORKBOOK_NOT_EXISTS, {
            code: US_ERRORS.WORKBOOK_NOT_EXISTS,
        });
    }

    if (model.deletedAt === null) {
        throw new AppError(US_ERRORS.WORKBOOK_IS_ALREADY_RESTORED, {
            code: US_ERRORS.WORKBOOK_IS_ALREADY_RESTORED,
        });
    }

    const primaryTrx = getPrimary(trx);

    const result = await transaction(primaryTrx, async (transactionTrx) => {
        const restoredWorkbook = await WorkbookModel.query(transactionTrx)
            .patch({
                [WorkbookModelColumn.DeletedBy]: null,
                [WorkbookModelColumn.DeletedAt]: null,
                [WorkbookModelColumn.UpdatedAt]: raw(CURRENT_TIMESTAMP),
            })
            .where({
                [WorkbookModelColumn.WorkbookId]: model.workbookId,
                [WorkbookModelColumn.TenantId]: model.tenantId,
            })
            .returning('*')
            .first()
            .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

        await Entry.query(transactionTrx)
            .patch({
                key: raw(`regexp_replace(key, '${TRASH_FOLDER}/', '')`),
                displayKey: raw(`regexp_replace(display_key, '${TRASH_FOLDER}/', '')`),
                innerMeta: raw(`inner_meta - 'oldKey' - 'oldDisplayKey'`),
                isDeleted: false,
                deletedAt: null,
                updatedAt: raw(CURRENT_TIMESTAMP),
            })
            .where({
                [EntryColumn.WorkbookId]: model.workbookId,
                [EntryColumn.TenantId]: model.tenantId,
            })
            .andWhere(EntryColumn.DeletedAt, '>=', model.deletedAt)
            .timeout(DEFAULT_QUERY_TIMEOUT);

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
