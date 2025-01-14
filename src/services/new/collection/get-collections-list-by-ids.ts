import {CollectionModel, CollectionModelColumn} from '../../../db/models/new/collection';
import {CollectionPermission} from '../../../entities/collection';
import {CollectionInstance} from '../../../registry/common/entities/collection/types';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

import {makeCollectionsWithParentsMap} from './utils';

export interface GetCollectionsListByIdsArgs {
    collectionIds: string[];
    includePermissionsInfo?: boolean;
}

export const getCollectionsListByIds = async (
    {ctx, trx, skipCheckPermissions = false}: ServiceArgs,
    args: GetCollectionsListByIdsArgs,
) => {
    const {collectionIds, includePermissionsInfo = false} = args;

    ctx.log('GET_COLLECTIONS_LIST_BY_IDS_START', {
        collectionIds: await Utils.macrotasksMap(collectionIds, (id) => Utils.encodeId(id)),
        includePermissionsInfo,
    });

    const {tenantId, projectId} = ctx.get('info');
    const registry = ctx.get('registry');

    const models = await CollectionModel.query(getReplica(trx))
        .where({
            [CollectionModelColumn.DeletedAt]: null,
            [CollectionModelColumn.TenantId]: tenantId,
            [CollectionModelColumn.ProjectId]: projectId,
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
    const acceptedCollectionsMap = new Map<CollectionModel, string[]>();

    const checkPermissionPromises: Promise<CollectionInstance | void>[] = [];

    collectionsMap.forEach((parentIds, collection) => {
        const promise = collection
            .checkPermission({
                parentIds,
                permission: CollectionPermission.LimitedView,
            })
            .then(() => {
                acceptedCollectionsMap.set(collection.model, parentIds);

                return collection;
            })
            .catch(() => {});

        checkPermissionPromises.push(promise);
    });

    let collections = await Promise.all(checkPermissionPromises);

    if (includePermissionsInfo) {
        const {bulkFetchCollectionsAllPermissions} = registry.common.functions.get();

        const mappedCollections: {model: CollectionModel; parentIds: string[]}[] = [];

        acceptedCollectionsMap.forEach((parentIds, collectionModel) => {
            mappedCollections.push({
                model: collectionModel,
                parentIds,
            });
        });

        collections = await bulkFetchCollectionsAllPermissions(ctx, mappedCollections);
    }

    const result = collections.filter((item) => Boolean(item)) as CollectionInstance[];

    ctx.log('GET_COLLECTIONS_LIST_BY_IDS_FINISH', {
        collectionIds: await Utils.macrotasksMap(
            result.map((item) => item.model.collectionId),
            (id) => Utils.encodeId(id),
        ),
    });

    return result;
};
