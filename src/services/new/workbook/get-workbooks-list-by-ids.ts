import {Feature, isEnabledFeature} from '../../../components/features';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import {WorkbookPermission} from '../../../entities/workbook';
import {WorkbookInstance} from '../../../registry/common/entities/workbook/types';
import Utils from '../../../utils';
import {makeWorkbooksWithParentsMap} from '../collection/utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['workbookIds'],
    properties: {
        workbookIds: {
            type: 'array',
            minItems: 1,
            maxItems: 1000,
            items: {type: 'string'},
        },
        includePermissionsInfo: {
            type: 'boolean',
        },
    },
});

type GetWorkbooksListAndAllParentsArgs = {
    workbookIds: string[];
    includePermissionsInfo?: boolean;
};

export const getWorkbooksListByIds = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: GetWorkbooksListAndAllParentsArgs,
) => {
    const {workbookIds, includePermissionsInfo = false} = args;

    ctx.log('GET_WORKBOOKS_LIST_BY_IDS_STARTED', {
        workbookIds: await Utils.macrotasksMap(workbookIds, (id) => Utils.encodeId(id)),
        includePermissionsInfo,
    });

    const {tenantId, isPrivateRoute} = ctx.get('info');
    const registry = ctx.get('registry');

    if (!skipValidation) {
        validateArgs(args);
    }

    const targetTrx = getReplica(trx);

    const workbookList = await WorkbookModel.query(targetTrx)
        .where({
            [WorkbookModelColumn.DeletedAt]: null,
            [WorkbookModelColumn.TenantId]: tenantId,
        })
        .whereIn([WorkbookModelColumn.WorkbookId], workbookIds)
        .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

    const {accessServiceEnabled} = ctx.config;

    const {Workbook} = registry.common.classes.get();

    if (!accessServiceEnabled || skipCheckPermissions || isPrivateRoute) {
        if (includePermissionsInfo) {
            return workbookList.map((model) => {
                const workbook = new Workbook({ctx, model});
                workbook.enableAllPermissions();
                return workbook;
            });
        }

        return workbookList.map((model) => new Workbook({ctx, model}));
    }

    const workbooksMap = await makeWorkbooksWithParentsMap({ctx, trx}, {models: workbookList});
    const acceptedWorkbooksMap = new Map<WorkbookModel, string[]>();

    const checkPermissionPromises: Promise<WorkbookInstance | void>[] = [];

    workbooksMap.forEach((parentIds, workbook) => {
        const promise = workbook
            .checkPermission({
                parentIds,
                permission: isEnabledFeature(ctx, Feature.UseLimitedView)
                    ? WorkbookPermission.LimitedView
                    : WorkbookPermission.View,
            })
            .then(() => {
                acceptedWorkbooksMap.set(workbook.model, parentIds);

                return workbook;
            })
            .catch(() => {});

        checkPermissionPromises.push(promise);
    });

    let workbooks = await Promise.all(checkPermissionPromises);

    if (includePermissionsInfo) {
        const {bulkFetchWorkbooksAllPermissions} = registry.common.functions.get();

        const mappedWorkbooks: {model: WorkbookModel; parentIds: string[]}[] = [];

        acceptedWorkbooksMap.forEach((parentIds, workbookModel) => {
            mappedWorkbooks.push({
                model: workbookModel,
                parentIds,
            });
        });

        workbooks = await bulkFetchWorkbooksAllPermissions(ctx, mappedWorkbooks);
    }

    const result = workbooks.filter((item) => Boolean(item)) as WorkbookInstance[];

    ctx.log('GET_WORKBOOKS_LIST_BY_IDS_FINISHED', {
        workbookIds: await Utils.macrotasksMap(workbookList, (workbook) =>
            Utils.encodeId(workbook.workbookId),
        ),
    });

    return result;
};
