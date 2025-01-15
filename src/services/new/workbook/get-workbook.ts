import {AppError} from '@gravity-ui/nodekit';

import {Feature, isEnabledFeature} from '../../../components/features';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {US_ERRORS} from '../../../const';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import {WorkbookPermission} from '../../../entities/workbook';
import type {WorkbookInstance} from '../../../registry/common/entities/workbook/types';
import Utils from '../../../utils';
import {getParentIds} from '../collection/utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['workbookId'],
    properties: {
        workbookId: {
            type: 'string',
        },
        includePermissionsInfo: {
            type: 'boolean',
        },
    },
});

export interface GetWorkbookArgs {
    workbookId: string;
    includePermissionsInfo?: boolean;
}

export const getWorkbook = async <T extends WorkbookInstance = WorkbookInstance>(
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: GetWorkbookArgs,
): Promise<T> => {
    const {workbookId, includePermissionsInfo = false} = args;

    ctx.log('GET_WORKBOOK_START', {
        workbookId: Utils.encodeId(workbookId),
        includePermissionsInfo,
    });

    if (!skipValidation) {
        validateArgs(args);
    }

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
            permission: isEnabledFeature(ctx, Feature.UseLimitedView)
                ? WorkbookPermission.LimitedView
                : WorkbookPermission.View,
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
