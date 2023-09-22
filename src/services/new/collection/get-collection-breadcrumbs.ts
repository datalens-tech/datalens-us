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
}

export const getCollectionBreadcrumbs = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: GetCollectionBreadcrumbsArgs,
) => {
    const {collectionId} = args;

    const {accessServiceEnabled} = ctx.config;

    logInfo(ctx, 'GET_COLLECTION_BREADCRUMBS_START', {
        collectionId: Utils.encodeId(collectionId),
    });

    if (!skipValidation) {
        validateArgs(args);
    }

    const targetTrx = getReplica(trx);

    const breadcrumbs = await getParents({ctx, trx: targetTrx, collectionId});

    if (breadcrumbs.length === 0) {
        throw new AppError(US_ERRORS.COLLECTION_NOT_EXISTS, {
            code: US_ERRORS.COLLECTION_NOT_EXISTS,
        });
    }

    if (accessServiceEnabled && !skipCheckPermissions) {
        const {Collection} = registry.common.classes.get();

        const breadcrumbsIds = breadcrumbs.map((model) => model.collectionId);

        const checkPermissionPromises = breadcrumbs.map((breadcrumb, index) => {
            const collection = new Collection({
                ctx,
                model: breadcrumb,
            });

            return collection.checkPermission({
                parentIds: breadcrumbsIds.slice(index + 1),
                permission: isEnabledFeature(ctx, Feature.UseLimitedView)
                    ? CollectionPermission.LimitedView
                    : CollectionPermission.View,
            });
        });

        await Promise.all(checkPermissionPromises);
    }

    logInfo(ctx, 'GET_COLLECTION_BREADCRUMBS_FINISH', {
        collectionId: Utils.encodeId(collectionId),
        collectionsLength: breadcrumbs.length,
    });

    return breadcrumbs.reverse();
};
