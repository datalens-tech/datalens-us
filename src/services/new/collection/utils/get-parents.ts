import {TransactionOrKnex} from 'objection';
import {AppContext} from '@gravity-ui/nodekit';
import {getReplica} from '../../utils';
import {CollectionModel, CollectionModelColumn} from '../../../../db/models/new/collection';
import {WorkbookInstance} from '../../../../registry/common/entities/workbook/types';
import {CollectionInstance} from '../../../../registry/common/entities/collection/types';
import {ServiceArgs} from '../../types';
import {registry} from '../../../../registry';
import {WorkbookModel} from '../../../../db/models/new/workbook';

interface Ctx {
    ctx: AppContext;
    trx?: TransactionOrKnex;
}

interface GetCollectionsParentIds extends Ctx {
    collectionIds: Nullable<string>[];
}

interface GetCollectionParentIds extends Ctx {
    collectionId: string;
}

export const getParents = async ({ctx, trx, collectionIds}: GetCollectionsParentIds) => {
    const {tenantId, projectId, onlyMirrored} = ctx.get('info');

    const targetTrx = getReplica(trx);

    const recursiveName = 'collectionParents';

    const result = await CollectionModel.query(targetTrx)
        .withRecursive(recursiveName, (qb1) => {
            qb1.select()
                .from(CollectionModel.tableName)
                .where({
                    ...(onlyMirrored ? {} : {[CollectionModelColumn.TenantId]: tenantId}),
                    [CollectionModelColumn.ProjectId]: projectId,
                    [CollectionModelColumn.DeletedAt]: null,
                })
                .whereIn([CollectionModelColumn.CollectionId], collectionIds)
                .union((qb2) => {
                    qb2.select(`${CollectionModel.tableName}.*`)
                        .from(CollectionModel.tableName)
                        .where({
                            ...(onlyMirrored
                                ? {}
                                : {
                                      [`${CollectionModel.tableName}.${CollectionModelColumn.TenantId}`]:
                                          tenantId,
                                  }),
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

export const getParentIds = async ({ctx, trx, collectionId}: GetCollectionParentIds) => {
    const parents = await getParents({ctx, trx, collectionIds: [collectionId]});
    return parents.map((item) => item.collectionId);
};

export const getCollectionsParentIds = async ({
    ctx,
    trx,
    collectionIds,
}: GetCollectionsParentIds) => {
    const parents = await getParents({ctx, trx, collectionIds});
    return parents.map((item) => item.collectionId);
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

const makeParentsMap = (collectionModels: CollectionModel[]) => {
    const parentsMap = new Map<string, Nullable<string>>();

    collectionModels.forEach((parent: CollectionModel) => {
        parentsMap.set(parent.collectionId, parent.parentId);
    });

    return parentsMap;
};

export const makeWorkbooksWithParentsMap = async (
    {trx, ctx}: ServiceArgs,
    {
        models,
    }: {
        models: WorkbookModel[];
    },
): Promise<Map<WorkbookInstance, string[]>> => {
    const workbooksWithParentsMap = new Map<WorkbookInstance, string[]>();
    const collectionIds = models.map((item) => item.collectionId).filter((item) => Boolean(item));

    const parents = await getParents({
        ctx,
        trx: getReplica(trx),
        collectionIds,
    });

    const parentsMap = makeParentsMap(parents);

    const {Workbook} = registry.common.classes.get();

    models.forEach((model) => {
        const collectionId = model.collectionId;

        const parentsForWorkbook = getParentsIdsFromMap(collectionId, parentsMap);

        const workbook = new Workbook({ctx, model});

        workbooksWithParentsMap.set(workbook, parentsForWorkbook);
    });

    return workbooksWithParentsMap;
};

export const makeCollectionsWithParentsMap = async (
    {ctx, trx}: ServiceArgs,
    {
        models,
    }: {
        models: CollectionModel[];
    },
): Promise<Map<CollectionInstance, string[]>> => {
    const collectionsWithParentsMap = new Map<CollectionInstance, string[]>();
    const collectionIds = models.map((item) => item.collectionId).filter((item) => Boolean(item));

    const parents = await getParents({
        ctx,
        trx: getReplica(trx),
        collectionIds,
    });

    const parentsMap = makeParentsMap(parents);

    const {Collection} = registry.common.classes.get();

    models.forEach((model) => {
        const parentId = model.parentId;

        const parentsForCollection = getParentsIdsFromMap(parentId, parentsMap);

        const collection = new Collection({ctx, model});

        collectionsWithParentsMap.set(collection, parentsForCollection);
    });

    return collectionsWithParentsMap;
};
