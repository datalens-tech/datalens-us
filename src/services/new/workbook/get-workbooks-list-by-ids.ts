import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';
import Utils, {logInfo} from '../../../utils';
import {registry} from '../../../registry';

import {getParents} from '../collection/utils';

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
    workbookIds: Nullable<string>[];
    includePermissionsInfo?: boolean;
};

export const getParentsIdsFromMap = (
    collectionId: string | null,
    parentsMap: Map<string, Nullable<string>>,
): string[] => {
    let id: Nullable<string> = collectionId;
    const arr: string[] = id ? [id] : [];

    while (id !== null) {
        const curr: Nullable<string> = parentsMap.get(id) || null;

        if (curr) arr.push(curr);

        id = curr;
    }

    return arr;
};

export const getWorkbooksListByIds = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: GetWorkbooksListAndAllParentsArgs,
) => {
    const {workbookIds, includePermissionsInfo = false} = args;

    logInfo(ctx, 'GET_WORKBOOKS_LIST_BY_IDS_STARTED', {
        workbookIds: workbookIds.map((id) => Utils.encodeId(id)),
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
            const workbook = new Workbook({
                ctx,
                model: workbookModel,
            });

            mappedWorkbooks.push({
                model: workbook.model,
                parentIds,
            });
        });

        workbooks = await bulkFetchWorkbooksAllPermissions(ctx, mappedWorkbooks);
    }

    const result: WorkbookInstance[] = workbooks.filter((item) =>
        Boolean(item),
    ) as WorkbookInstance[];

    logInfo(ctx, 'GET_WORKBOOKS_LIST_BY_IDS_FINISHED', {
        workbookIds: workbookList.map((workbook) => Utils.encodeId(workbook.workbookId)),
    });

    return result;
};
