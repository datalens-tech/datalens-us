import {AppError} from '@gravity-ui/nodekit';
import {getParentIds} from './utils/get-parents';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {US_ERRORS} from '../../../const';
import {CollectionModel, CollectionModelColumn} from '../../../db/models/new/collection';
import {CollectionPermission} from '../../../entities/collection';
import Utils, {logInfo} from '../../../utils';
import {registry} from '../../../registry';
import {Feature, isEnabledFeature} from '../../../components/features';

import type {CollectionInstance} from '../../../registry/common/entities/collection/types';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['collectionId'],
    properties: {
        collectionId: {
            type: 'string',
        },
        includePermissionsInfo: {
            type: 'boolean',
        },
    },
});

export interface GetCollectionArgs {
    collectionId: string;
    includePermissionsInfo?: boolean;
}

export const getCollection = async <T extends CollectionInstance = CollectionInstance>(
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: GetCollectionArgs,
): Promise<T> => {
    const {collectionId, includePermissionsInfo = false} = args;

    logInfo(ctx, 'GET_COLLECTION_START', {
        collectionId: Utils.encodeId(collectionId),
        includePermissionsInfo,
    });

    if (!skipValidation) {
        validateArgs(args);
    }

    const {tenantId, projectId, isPrivateRoute} = ctx.get('info');

    const {accessServiceEnabled} = ctx.config;

    const targetTrx = getReplica(trx);

    const model: Optional<CollectionModel> = await CollectionModel.query(targetTrx)
        .select()
        .where({
            [CollectionModelColumn.DeletedAt]: null,
            [CollectionModelColumn.CollectionId]: collectionId,
            ...(isPrivateRoute
                ? {}
                : {
                      [CollectionModelColumn.TenantId]: tenantId,
                      [CollectionModelColumn.ProjectId]: projectId,
                  }),
        })
        .first()
        .timeout(CollectionModel.DEFAULT_QUERY_TIMEOUT);

    if (!model) {
        throw new AppError(US_ERRORS.COLLECTION_NOT_EXISTS, {
            code: US_ERRORS.COLLECTION_NOT_EXISTS,
        });
    }

    const {Collection} = registry.common.classes.get();

    const collection = new Collection({
        ctx,
        model,
    });

    if (accessServiceEnabled && !skipCheckPermissions && !isPrivateRoute) {
        let parentIds: string[] = [];

        if (collection.model.parentId !== null) {
            parentIds = await getParentIds({
                ctx,
                trx: targetTrx,
                collectionId: collection.model.parentId,
            });
        }

        logInfo(ctx, 'CHECK_VIEW_PERMISSION');

        await collection.checkPermission({
            parentIds,
            permission: isEnabledFeature(ctx, Feature.UseLimitedView)
                ? CollectionPermission.LimitedView
                : CollectionPermission.View,
        });

        if (includePermissionsInfo) {
            await collection.fetchAllPermissions({parentIds});
        }
    }

    logInfo(ctx, 'GET_COLLECTION_FINISH', {
        collectionId: Utils.encodeId(collection.model.collectionId),
    });

    return collection as T;
};
