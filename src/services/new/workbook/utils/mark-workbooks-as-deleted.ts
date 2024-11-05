import {raw} from 'objection';
import {CURRENT_TIMESTAMP} from '../../../../const';
import {WorkbookModel, WorkbookModelColumn} from '../../../../db/models/new/workbook';
import {ServiceArgs} from '../../types';
import {getPrimary} from '../../utils';

export const markWorkbooksAsDeleted = async (
    {ctx, trx}: ServiceArgs,
    {workbookIds}: {workbookIds: string[]},
) => {
    const {
        user: {userId},
    } = ctx.get('info');

    const workbooks = await WorkbookModel.query(getPrimary(trx))
        .patch({
            [WorkbookModelColumn.DeletedBy]: userId,
            [WorkbookModelColumn.DeletedAt]: raw(CURRENT_TIMESTAMP),
        })
        .whereIn([WorkbookModelColumn.WorkbookId], workbookIds)
        .returning('*')
        .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

    return workbooks;
};
