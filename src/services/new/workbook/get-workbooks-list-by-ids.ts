import {TransactionOrKnex} from 'objection';
import {AppContext} from '@gravity-ui/nodekit';

import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';
import Utils, {logInfo} from '../../../utils';
import {registry} from '../../../registry';

import {WorkbookPermission} from '../../../entities/workbook';

import {Feature, isEnabledFeature} from '../../../components/features';

import {CollectionModel, CollectionModelColumn} from '../../../db/models/new/collection';

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

interface GetParentsArgs {
    ctx: AppContext;
    trx?: TransactionOrKnex;
    collectionIds: Nullable<string>[];
}

export const getParentsByIds = async ({ctx, trx, collectionIds}: GetParentsArgs) => {
    const {tenantId, projectId} = ctx.get('info');

    const targetTrx = getReplica(trx);

    const recursiveName = 'collectionParents';

    const result = await CollectionModel.query(targetTrx)
        .withRecursive(recursiveName, (qb1) => {
            qb1.select()
                .from(CollectionModel.tableName)
                .where({
                    [CollectionModelColumn.TenantId]: tenantId,
                    [CollectionModelColumn.ProjectId]: projectId,
                    [CollectionModelColumn.DeletedAt]: null,
                })
                .whereIn([CollectionModelColumn.CollectionId], collectionIds)
                .union((qb2) => {
                    qb2.select(`${CollectionModel.tableName}.*`)
                        .from(CollectionModel.tableName)
                        .where({
                            [`${CollectionModel.tableName}.${CollectionModelColumn.TenantId}`]:
                                tenantId,
                            [`${CollectionModel.tableName}.${CollectionModelColumn.ProjectId}`]:
                                projectId,
                            [`${CollectionModel.tableName}.${CollectionModelColumn.DeletedAt}`]:
                                null,
                        })
                        .join(
                            recursiveName,
                            `${recursiveName}.${CollectionModelColumn.ParentId}`,
                            `${CollectionModel.tableName}.${CollectionModelColumn.CollectionId}`,
                        );
                });
        })
        .select()
        .from(recursiveName)
        .timeout(CollectionModel.DEFAULT_QUERY_TIMEOUT);

    return result;
};

export const getWorkbooksListByIds = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: GetWorkbooksListAndAllParentsArgs,
): Promise<WorkbookModel[]> => {
    const {workbookIds} = args;

    logInfo(ctx, 'GET WORKBOOKS LIST BY IDS STARTED', {
        workbookIds: workbookIds.map((id) => Utils.encodeId(id)),
    });

    const {tenantId, isPrivateRoute} = ctx.get('info');

    if (!skipValidation) {
        validateArgs(args);
    }

    const targetTrx = getReplica(trx);

    const workbookList = await WorkbookModel.query(targetTrx)
        .where({
            [WorkbookModelColumn.DeletedAt]: null,
            [WorkbookModelColumn.TenantId]: tenantId,
        })
        .whereIn([WorkbookModelColumn.WorkbookId], workbookIds);

    const {accessServiceEnabled} = ctx.config;

    if ((!accessServiceEnabled && skipCheckPermissions) || isPrivateRoute) {
        return workbookList;
    }

    const {Workbook} = registry.common.classes.get();

    const collectionIds: Nullable<string>[] | [] = workbookList
        .map((workbook) => workbook.collectionId)
        .filter((item) => Boolean(item));

    const parents = await getParentsByIds({
        ctx,
        trx: targetTrx,
        collectionIds,
    });

    const workbooksMap = new Map<WorkbookModel, string[]>();

    const result: WorkbookModel[] = [];

    workbookList.forEach(async (model) => {
        const collectionId =
            parents.find((item) => item.collectionId === model.collectionId)?.collectionId || null;

        const map: {[key: string]: string | null} = {};

        parents.forEach((parent: CollectionModel) => {
            map[parent.collectionId] = parent.parentId;
        });

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

    logInfo(ctx, 'GET WORKBOOKS LIST BY IDS FINISHED', {
        workbookIds: workbookList.map((workbook) => Utils.encodeId(workbook.workbookId)),
    });

    return result;
};
