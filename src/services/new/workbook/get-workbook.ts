import {AppError} from '@gravity-ui/nodekit';

import {US_ERRORS} from '../../../const';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import {WorkbookPermission} from '../../../entities/workbook';
import type {WorkbookInstance} from '../../../registry/plugins/common/entities/workbook/types';
import Utils from '../../../utils';
import {getParentIds} from '../collection/utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

export interface GetWorkbookArgs {
    workbookId: string;
    includePermissionsInfo?: boolean;
    getParentsQueryTimeout?: number;
    getWorkbookQueryTimeout?: number;
}

export const getWorkbook = async <T extends WorkbookInstance = WorkbookInstance>(
    {ctx, trx, skipCheckPermissions = false}: ServiceArgs,
    args: GetWorkbookArgs,
): Promise<T> => {
    const {
        workbookId,
        includePermissionsInfo = false,
        getParentsQueryTimeout,
        getWorkbookQueryTimeout = WorkbookModel.DEFAULT_QUERY_TIMEOUT,
    } = args;

    ctx.log('GET_WORKBOOK_START', {
        workbookId: Utils.encodeId(workbookId),
        includePermissionsInfo,
    });

    const {tenantId, isPrivateRoute, onlyMirrored} = ctx.get('info');
    const {accessServiceEnabled} = ctx.config;

    const registry = ctx.get('registry');

    if (!isPrivateRoute) {
        const {fetchAndValidateLicenseOrFail} = registry.common.functions.get();
        await fetchAndValidateLicenseOrFail({ctx});
    }

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
        .timeout(getWorkbookQueryTimeout);

    if (!model) {
        throw new AppError(US_ERRORS.WORKBOOK_NOT_EXISTS, {
            code: US_ERRORS.WORKBOOK_NOT_EXISTS,
        });
    }

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
                getParentsQueryTimeout,
            });
        }

        ctx.log('CHECK_VIEW_PERMISSION');

        if (includePermissionsInfo) {
            await workbook.fetchAllPermissions({parentIds});

            if (!workbook.permissions?.[WorkbookPermission.LimitedView]) {
                throw new AppError(US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED, {
                    code: US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED,
                });
            }
        } else {
            await workbook.checkPermission({
                parentIds,
                permission: WorkbookPermission.LimitedView,
            });
        }
    } else if (includePermissionsInfo) {
        workbook.enableAllPermissions();
    }

    ctx.log('GET_WORKBOOK_FINISH', {
        workbookId: Utils.encodeId(workbook.model.workbookId),
    });

    return workbook as T;
};
