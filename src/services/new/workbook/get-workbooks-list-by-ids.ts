import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';
import Utils from '../../../utils';
import {registry} from '../../../registry';

import {getParents, getParentsIdsFromMap} from '../collection/utils';

import {WorkbookPermission} from '../../../entities/workbook';

import {Feature, isEnabledFeature} from '../../../components/features';

import {CollectionModel} from '../../../db/models/new/collection';
import {WorkbookInstance} from '../../../registry/common/entities/workbook/types';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['workbookIds'],
    properties: {
        workbookId: {
            type: ['array', 'string'],
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

    const {tenantId, isPrivateRoute, projectId} = ctx.get('info');

    if (!skipValidation) {
        validateArgs(args);
    }

    const targetTrx = getReplica(trx);

    const workbookList = await WorkbookModel.query(targetTrx)
        .where({
            [WorkbookModelColumn.DeletedAt]: null,
            [WorkbookModelColumn.TenantId]: tenantId,
            [WorkbookModelColumn.ProjectId]: projectId,
        })
        .whereIn([WorkbookModelColumn.WorkbookId], workbookIds)
        .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

    const {accessServiceEnabled} = ctx.config;

    const {Workbook} = registry.common.classes.get();

    let result;

    if (!accessServiceEnabled || skipCheckPermissions || isPrivateRoute) {
        if (includePermissionsInfo) {
            result = workbookList.map((model) => {
                const workbook = new Workbook({ctx, model});
                workbook.enableAllPermissions();
                return workbook;
            });
        } else {
            result = workbookList.map((model) => new Workbook({ctx, model}));
        }
    } else {
        const collectionIds = workbookList
            .map((workbook) => workbook.collectionId)
            .filter((item) => Boolean(item));

        const parents = await getParents({
            ctx,
            trx: targetTrx,
            collectionIds,
        });

        const workbooksMap = new Map<WorkbookModel, string[]>();
        const acceptedWorkbooksMap = new Map<WorkbookModel, string[]>();

        const parentsMap = new Map<string, Nullable<string>>();

        parents.forEach((parent: CollectionModel) => {
            parentsMap.set(parent.collectionId, parent.parentId);
        });

        workbookList.forEach((model) => {
            const collectionId = model.collectionId;

            const parentsforWorkbook = getParentsIdsFromMap(collectionId, parentsMap);

            workbooksMap.set(model, parentsforWorkbook);
        });

        const checkPermissionPromises: Promise<WorkbookInstance | void>[] = [];

        workbooksMap.forEach((parentIds, workbookModel) => {
            const workbook = new Workbook({
                ctx,
                model: workbookModel,
            });

            const promise = workbook
                .checkPermission({
                    parentIds,
                    permission: isEnabledFeature(ctx, Feature.UseLimitedView)
                        ? WorkbookPermission.LimitedView
                        : WorkbookPermission.View,
                })
                .then(() => {
                    acceptedWorkbooksMap.set(workbookModel, parentIds);

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

        result = workbooks.filter((item) => Boolean(item)) as WorkbookInstance[];
    }

    ctx.log('GET_WORKBOOKS_LIST_BY_IDS_FINISHED', {
        workbookIds: await Utils.macrotasksMap(workbookList, (workbook) =>
            Utils.encodeId(workbook.workbookId),
        ),
    });

    return result;
};
