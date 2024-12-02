import {raw} from 'objection';

import {CURRENT_TIMESTAMP} from '../../../../const';
import {WorkbookModel, WorkbookModelColumn} from '../../../../db/models/new/workbook';
import {WorkbookInstance} from '../../../../registry/common/entities/workbook/types';
import {ServiceArgs} from '../../types';
import {getPrimary} from '../../utils';

export const markWorkbooksAsDeleted = async (
    {ctx, trx, skipCheckPermissions}: ServiceArgs,
    {workbooksMap}: {workbooksMap: Map<WorkbookInstance, string[]>},
) => {
    const workbookIds: string[] = [];

    workbooksMap.forEach((parentIds, workbookInstance) => {
        workbookIds.push(workbookInstance.model.workbookId);
    });

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

    const deletePermissionsPromises: Promise<void>[] = [];

    workbooksMap.forEach((parentIds, workbookInstance) => {
        deletePermissionsPromises.push(
            workbookInstance.deletePermissions({
                parentIds,
                skipCheckPermissions,
            }),
        );
    });

    await Promise.all(deletePermissionsPromises);

    return workbooks;
};
