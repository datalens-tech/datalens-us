import {markWorkbooksAsDeleted} from '../../../../services/new/workbook/utils/mark-workbooks-as-deleted';
import type {BulkFetchWorkbooksAllPermissions, DeleteWorkbooksList} from './types';
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

export const deleteWorkbooksList: DeleteWorkbooksList = async ({ctx, trx}, {workbooksMap}) => {
    const workbookIds: string[] = [];

    workbooksMap.forEach((parentIds, workbook) => {
        workbookIds.push(workbook.workbookId);
    });

    const workbooks = await markWorkbooksAsDeleted({ctx, trx}, {workbookIds});

    return workbooks;
};
