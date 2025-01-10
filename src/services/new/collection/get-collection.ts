import {AppError} from '@gravity-ui/nodekit';

import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {US_ERRORS} from '../../../const';
import {CollectionModel, CollectionModelColumn} from '../../../db/models/new/collection';
import {CollectionPermission} from '../../../entities/collection';
import type {CollectionInstance} from '../../../registry/common/entities/collection/types';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

import {checkAndSetCollectionPermission} from './utils';

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
        permission: {
            type: 'string',
        },
    },
});

export interface GetCollectionArgs {
    collectionId: string;
    includePermissionsInfo?: boolean;
    permission?: CollectionPermission;
}

export const getCollection = async <T extends CollectionInstance = CollectionInstance>(
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: GetCollectionArgs,
): Promise<T> => {
    const {collectionId, includePermissionsInfo = false, permission} = args;

    ctx.log('GET_COLLECTION_START', {
        collectionId: Utils.encodeId(collectionId),
        includePermissionsInfo,
    });

    if (!skipValidation) {
        validateArgs(args);
    }

    const {tenantId, isPrivateRoute} = ctx.get('info');

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
                  }),
        })
        .first()
        .timeout(CollectionModel.DEFAULT_QUERY_TIMEOUT);

    if (!model) {
        throw new AppError(US_ERRORS.COLLECTION_NOT_EXISTS, {
            code: US_ERRORS.COLLECTION_NOT_EXISTS,
        });
    }

    const registry = ctx.get('registry');
    const {Collection} = registry.common.classes.get();

    const collectionInstance = new Collection({
        ctx,
        model,
    });

    const collection = await checkAndSetCollectionPermission(
        {ctx, trx},
        {collectionInstance, skipCheckPermissions, includePermissionsInfo, permission},
    );

    ctx.log('GET_COLLECTION_FINISH', {
        collectionId: Utils.encodeId(model.collectionId),
    });

    return collection as T;
};
