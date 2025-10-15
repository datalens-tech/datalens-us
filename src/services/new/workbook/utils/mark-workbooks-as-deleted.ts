import {AppError} from '@gravity-ui/nodekit';
import {raw} from 'objection';

import {CURRENT_TIMESTAMP, US_ERRORS} from '../../../../const';
import {WorkbookModel, WorkbookModelColumn} from '../../../../db/models/new/workbook';
import {WorkbookInstance} from '../../../../registry/plugins/common/entities/workbook/types';
import {ServiceArgs} from '../../types';
import {getPrimary} from '../../utils';

type MarkWorkbooksAsDeletedArgs = {
    workbooksMap: Map<WorkbookInstance, string[]>;
    detachDeletePermissions?: boolean;
};

export const markWorkbooksAsDeleted = async (
    {ctx, trx, skipCheckPermissions}: ServiceArgs,
    {workbooksMap, detachDeletePermissions = false}: MarkWorkbooksAsDeletedArgs,
) => {
    const workbookIds: string[] = [];
    const workbookIdsMap = new Map<
        string,
        {workbookInstance: WorkbookInstance; parentIds: string[]}
    >();

    workbooksMap.forEach((parentIds, workbookInstance) => {
        workbookIds.push(workbookInstance.model.workbookId);
        workbookIdsMap.set(workbookInstance.model.workbookId, {
            workbookInstance,
            parentIds,
        });
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

    const deletePermissions = async () => {
        await Promise.all(
            workbooks.map(async ({workbookId}) => {
                const workbookData = workbookIdsMap.get(workbookId);
                if (!workbookData) {
                    throw new AppError(US_ERRORS.WORKBOOK_NOT_EXISTS, {
                        code: US_ERRORS.WORKBOOK_NOT_EXISTS,
                    });
                }
                const {workbookInstance, parentIds} = workbookData;
                await workbookInstance.deletePermissions({
                    parentIds,
                    skipCheckPermissions,
                });
            }),
        );
    };

    if (!detachDeletePermissions) {
        await deletePermissions();
    }

    return {
        workbooks,
        deletePermissions: detachDeletePermissions ? deletePermissions : undefined,
    };
};
