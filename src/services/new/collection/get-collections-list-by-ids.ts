import {CollectionModel, CollectionModelColumn} from '../../../db/models/new/collection';
import {CollectionPermission} from '../../../entities/collection';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

import {makeCollectionsWithParentsMap} from './utils';

export interface GetCollectionsListByIdsArgs {
    collectionIds: string[];
    includePermissionsInfo?: boolean;
    skipPermissionsFilter?: boolean;
}

export const getCollectionsListByIds = async (
    {ctx, trx, checkLicense, skipCheckPermissions = false}: ServiceArgs,
    args: GetCollectionsListByIdsArgs,
) => {
    const {collectionIds, includePermissionsInfo = false, skipPermissionsFilter = false} = args;

    ctx.log('GET_COLLECTIONS_LIST_BY_IDS_START', {
        collectionIds: await Utils.macrotasksMap(collectionIds, (id) => Utils.encodeId(id)),
        includePermissionsInfo,
    });

    const {tenantId, isPrivateRoute} = ctx.get('info');
    const registry = ctx.get('registry');

    const {fetchAndValidateLicenseOrFail} = registry.common.functions.get();

    if (checkLicense && !isPrivateRoute) {
        await fetchAndValidateLicenseOrFail({ctx});
    }

    const models = await CollectionModel.query(getReplica(trx))
        .where({
            [CollectionModelColumn.DeletedAt]: null,
            [CollectionModelColumn.TenantId]: tenantId,
        })
        .whereIn(CollectionModelColumn.CollectionId, collectionIds)
        .timeout(CollectionModel.DEFAULT_QUERY_TIMEOUT);

    const {accessServiceEnabled} = ctx.config;

    const {Collection} = registry.common.classes.get();

    if (!accessServiceEnabled || skipCheckPermissions) {
        if (includePermissionsInfo) {
            return models.map((model) => {
                const collection = new Collection({ctx, model});
                collection.enableAllPermissions();
                return collection;
            });
        }

        return models.map((model) => new Collection({ctx, model}));
    }

    const collectionsMap = await makeCollectionsWithParentsMap({ctx, trx}, {models});

    const collectionsForBulk: {model: CollectionModel; parentIds: string[]}[] = [];

    collectionsMap.forEach((parentIds, collection) => {
        collectionsForBulk.push({model: collection.model, parentIds});
    });

    let collections = await Collection.bulkFetchAllPermissions(ctx, collectionsForBulk);

    if (!skipPermissionsFilter) {
        collections = collections.filter(
            (collection) => collection.permissions?.[CollectionPermission.Browse] === true,
        );
    }

    if (!includePermissionsInfo) {
        collections = collections.map(
            (collection) => new Collection({ctx, model: collection.model}),
        );
    }

    ctx.log('GET_COLLECTIONS_LIST_BY_IDS_FINISH', {
        collectionIds: await Utils.macrotasksMap(
            collections.map((collection) => collection.model.collectionId),
            (id) => Utils.encodeId(id),
        ),
    });

    return collections;
};
