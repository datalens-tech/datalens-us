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

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['workbookIds'],
    properties: {
        workbookId: {
            type: ['array', 'string'],
        },
    },
});

type GetWorkbooksListAndAllParentsArgs = {
    workbookIds: Nullable<string>[];
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
    const {workbookIds} = args;

    logInfo(ctx, 'GET_WORKBOOKS_LIST_BY_IDS_STARTED', {
        workbookIds: workbookIds.map((id) => Utils.encodeId(id)),
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
        .whereIn([WorkbookModelColumn.WorkbookId], workbookIds);

    const {accessServiceEnabled} = ctx.config;

    if (!accessServiceEnabled || skipCheckPermissions || isPrivateRoute) {
        return workbookList;
    }

    const {Workbook} = registry.common.classes.get();

    const collectionIds = workbookList
        .map((workbook) => workbook.collectionId)
        .filter((item) => Boolean(item));

    const parents = await getParents({
        ctx,
        trx: targetTrx,
        collectionIds,
    });

    const workbooksMap = new Map<WorkbookModel, string[]>();

    let result: WorkbookModel[] = [];

    const parentsMap = new Map<string, Nullable<string>>();

    parents.forEach((parent: CollectionModel) => {
        parentsMap.set(parent.collectionId, parent.parentId);
    });

    workbookList.forEach((model) => {
        const collectionId = model.collectionId;

        const parentsforWorkbook = getParentsIdsFromMap(collectionId, parentsMap);

        workbooksMap.set(model, parentsforWorkbook);
    });

    const checkPermissionPromises: Promise<WorkbookModel | void>[] = [];

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
                return workbookModel;
            })
            .catch(() => {});

        checkPermissionPromises.push(promise);
    });

    const responses = await Promise.all(checkPermissionPromises);

    result = responses.filter((item) => Boolean(item)) as WorkbookModel[];

    logInfo(ctx, 'GET_WORKBOOKS_LIST_BY_IDS_FINISHED', {
        workbookIds: workbookList.map((workbook) => Utils.encodeId(workbook.workbookId)),
    });

    return result;
};
