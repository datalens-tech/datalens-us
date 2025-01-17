import {AppError} from '@gravity-ui/nodekit';

import {US_ERRORS} from '../../../const';
import {CollectionPermission} from '../../../entities/collection';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

import {getParents} from './utils/get-parents';

export interface GetCollectionBreadcrumbsArgs {
    collectionId: string;
    includePermissionsInfo?: boolean;
}

export const getCollectionBreadcrumbs = async (
    {ctx, trx, skipCheckPermissions = false}: ServiceArgs,
    args: GetCollectionBreadcrumbsArgs,
) => {
    const {collectionId, includePermissionsInfo} = args;

    const registry = ctx.get('registry');

    const {accessServiceEnabled} = ctx.config;

    ctx.log('GET_COLLECTION_BREADCRUMBS_START', {
        collectionId: Utils.encodeId(collectionId),
        includePermissionsInfo,
    });

    const targetTrx = getReplica(trx);

    const parentModels = await getParents({ctx, trx: targetTrx, collectionIds: [collectionId]});

    if (parentModels.length === 0) {
        throw new AppError(US_ERRORS.COLLECTION_NOT_EXISTS, {
            code: US_ERRORS.COLLECTION_NOT_EXISTS,
        });
    }

    const {Collection} = registry.common.classes.get();

    const collectionInstances = parentModels.map((parentModel) => {
        return new Collection({
            ctx,
            model: parentModel,
        });
    });

    if (accessServiceEnabled && !skipCheckPermissions) {
        const breadcrumbsIds = collectionInstances.map(
            (collectionInstance) => collectionInstance.model.collectionId,
        );

        const checkPermissionPromises = collectionInstances.map(
            async (collectionInstance, index) => {
                const parentIds = breadcrumbsIds.slice(index + 1);

                await collectionInstance.checkPermission({
                    parentIds,
                    permission: CollectionPermission.LimitedView,
                });

                if (includePermissionsInfo) {
                    await collectionInstance.fetchAllPermissions({
                        parentIds,
                    });
                }
            },
        );

        await Promise.all(checkPermissionPromises);
    }

    ctx.log('GET_COLLECTION_BREADCRUMBS_FINISH', {
        collectionId: Utils.encodeId(collectionId),
        collectionsLength: collectionInstances.length,
    });

    return collectionInstances.reverse();
};
