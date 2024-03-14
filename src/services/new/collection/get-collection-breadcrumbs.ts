import {AppError} from '@gravity-ui/nodekit';
import {getParents} from './utils/get-parents';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';
import {US_ERRORS} from '../../../const';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import Utils, {logInfo} from '../../../utils';
import {CollectionPermission} from '../../../entities/collection';
import {registry} from '../../../registry';
import {Feature, isEnabledFeature} from '../../../components/features';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['collectionId'],
    properties: {
        collectionId: {
            type: 'string',
        },
    },
});

export interface GetCollectionBreadcrumbsArgs {
    collectionId: string;
    includePermissionsInfo?: boolean;
}

export const getCollectionBreadcrumbs = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: GetCollectionBreadcrumbsArgs,
) => {
    const {collectionId, includePermissionsInfo} = args;

    const {accessServiceEnabled} = ctx.config;

    logInfo(ctx, 'GET_COLLECTION_BREADCRUMBS_START', {
        collectionId: Utils.encodeId(collectionId),
        includePermissionsInfo,
    });

    if (!skipValidation) {
        validateArgs(args);
    }

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
                    permission: isEnabledFeature(ctx, Feature.UseLimitedView)
                        ? CollectionPermission.LimitedView
                        : CollectionPermission.View,
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

    logInfo(ctx, 'GET_COLLECTION_BREADCRUMBS_FINISH', {
        collectionId: Utils.encodeId(collectionId),
        collectionsLength: collectionInstances.length,
    });

    return collectionInstances.reverse();
};
