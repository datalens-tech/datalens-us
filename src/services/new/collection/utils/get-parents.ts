import {TransactionOrKnex} from 'objection';
import {AppContext} from '@gravity-ui/nodekit';
import {getReplica} from '../../utils';
import {CollectionModel, CollectionModelColumn} from '../../../../db/models/new/collection';

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
