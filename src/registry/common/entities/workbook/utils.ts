import type {BulkFetchWorkbooksAllPermissions} from './types';
import {Workbook} from './workbook';

export const bulkFetchWorkbooksAllPermissions: BulkFetchWorkbooksAllPermissions = async (
    ctx,
    items,
) => {
    return items.map(({model}) => {
        const workbook = new Workbook({ctx, model});
        if (ctx.config.zitadelEnabled) {
            workbook.fetchAllPermissions({parentIds: []});
        } else {
            workbook.enableAllPermissions();
        }
        return workbook;
    });
};
