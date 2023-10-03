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
    map: {[key: string]: string | null},
): string[] => {
    let id: string | null = collectionId;
    const arr: string[] = id ? [id] : [];

    while (id !== null) {
        const curr: string | null = map[id];

        if (curr !== null) arr.push(curr);

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

    const result: WorkbookModel[] = [];

    const map: {[key: string]: string | null} = {};

    parents.forEach((parent: CollectionModel) => {
        map[parent.collectionId] = parent.parentId;
    });

    workbookList.forEach((model) => {
        const collectionId = model.collectionId;

        const parentsforWorkbook = getParentsIdsFromMap(collectionId, map);

        workbooksMap.set(model, parentsforWorkbook);
    });

    for await (const pair of workbooksMap) {
        const [workbookModel, parentIds] = pair;

        const workbook = new Workbook({
            ctx,
            model: workbookModel,
        });

        try {
            await workbook.checkPermission({
                parentIds,
                permission: isEnabledFeature(ctx, Feature.UseLimitedView)
                    ? WorkbookPermission.LimitedView
                    : WorkbookPermission.View,
            });

            result.push(workbookModel);
        } catch (e) {}
    }

    logInfo(ctx, 'GET_WORKBOOKS_LIST_BY_IDS_FINISHED', {
        workbookIds: workbookList.map((workbook) => Utils.encodeId(workbook.workbookId)),
    });

    return result;
};
