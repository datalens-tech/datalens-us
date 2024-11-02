import {raw} from 'objection';
import {CURRENT_TIMESTAMP} from '../../../../const';
import {WorkbookModel, WorkbookModelColumn} from '../../../../db/models/new/workbook';
import {ServiceArgs} from '../../../../services/new/types';
import {getPrimary} from '../../../../services/new/utils';
import type {BulkFetchWorkbooksAllPermissions} from './types';
import {Workbook} from './workbook';

export const bulkFetchWorkbooksAllPermissions: BulkFetchWorkbooksAllPermissions = async (
    ctx,
    items,
) => {
    return items.map(({model}) => {
        const workbook = new Workbook({ctx, model});
        if (ctx.config.accessServiceEnabled) {
            workbook.fetchAllPermissions({parentIds: []});
        } else {
            workbook.enableAllPermissions();
        }
        return workbook;
    });
};

export const markWorkbooksAsDeleted = async (
    {ctx, trx}: ServiceArgs,
    {workbookIds}: {workbookIds: string[]},
) => {
    const {
        user: {userId},
    } = ctx.get('info');

    await WorkbookModel.query(getPrimary(trx))
        .patch({
            [WorkbookModelColumn.DeletedBy]: userId,
            [WorkbookModelColumn.DeletedAt]: raw(CURRENT_TIMESTAMP),
        })
        .whereIn([WorkbookModelColumn.WorkbookId], workbookIds)
        .returning('*')
        .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

    if (ctx.config.accessServiceEnabled) {
    }
};
