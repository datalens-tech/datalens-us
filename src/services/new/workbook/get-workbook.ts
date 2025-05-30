import {AppError} from '@gravity-ui/nodekit';

import {US_ERRORS} from '../../../const';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import {WorkbookPermission} from '../../../entities/workbook';
import type {WorkbookInstance} from '../../../registry/common/entities/workbook/types';
import Utils from '../../../utils';
import {getParentIds} from '../collection/utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

export interface GetWorkbookArgs {
    workbookId: string;
    includePermissionsInfo?: boolean;
}

export const getWorkbook = async <T extends WorkbookInstance = WorkbookInstance>(
    {ctx, trx, skipCheckPermissions = false}: ServiceArgs,
    args: GetWorkbookArgs,
): Promise<T> => {
    const {workbookId, includePermissionsInfo = false} = args;

    ctx.log('GET_WORKBOOK_START', {
        workbookId: Utils.encodeId(workbookId),
        includePermissionsInfo,
    });

    const {tenantId, isPrivateRoute, onlyMirrored} = ctx.get('info');
    const {accessServiceEnabled} = ctx.config;

    const targetTrx = getReplica(trx);

    const model: Optional<WorkbookModel> = await WorkbookModel.query(targetTrx)
        .select()
        .where({
            [WorkbookModelColumn.DeletedAt]: null,
            [WorkbookModelColumn.WorkbookId]: workbookId,
            ...(isPrivateRoute || onlyMirrored
                ? {}
                : {
                      [WorkbookModelColumn.TenantId]: tenantId,
                  }),
        })
        .first()
        .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

    if (!model) {
        throw new AppError(US_ERRORS.WORKBOOK_NOT_EXISTS, {
            code: US_ERRORS.WORKBOOK_NOT_EXISTS,
        });
    }

    const registry = ctx.get('registry');
    const {Workbook} = registry.common.classes.get();

    const workbook = new Workbook({
        ctx,
        model,
    });

    if (accessServiceEnabled && !skipCheckPermissions && !isPrivateRoute && !onlyMirrored) {
        let parentIds: string[] = [];

        if (workbook.model.collectionId !== null) {
            parentIds = await getParentIds({
                ctx,
                trx: targetTrx,
                collectionId: workbook.model.collectionId,
            });
        }

        ctx.log('CHECK_VIEW_PERMISSION');

        await workbook.checkPermission({
            parentIds,
            permission: WorkbookPermission.LimitedView,
        });

        if (includePermissionsInfo) {
            await workbook.fetchAllPermissions({parentIds});
        }
    } else if (includePermissionsInfo) {
        workbook.enableAllPermissions();
    }

    ctx.log('GET_WORKBOOK_FINISH', {
        workbookId: Utils.encodeId(workbook.model.workbookId),
    });

    return workbook as T;
};
