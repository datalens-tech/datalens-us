import {ServiceArgs} from '../types';
import {getReplica} from '../utils';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {CollectionModel, CollectionModelColumn} from '../../../db/models/new/collection';
import {CollectionPermission} from '../../../entities/collection';
import Utils, {logInfo} from '../../../utils';
import {registry} from '../../../registry';
import {checkAndSetCollectionPermission} from './utils';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['collectionIds'],
    properties: {
        collectionIds: {
            type: 'array',
            items: {type: 'string'},
        },
        includePermissionsInfo: {
            type: 'boolean',
        },
        permission: {
            type: 'string',
        },
    },
});

export interface GetCollectionsListByIdsArgs {
    collectionIds: string[];
    includePermissionsInfo?: boolean;
    permission?: CollectionPermission;
}

export const getCollectionsListByIds = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: GetCollectionsListByIdsArgs,
) => {
    const {collectionIds, includePermissionsInfo = false, permission} = args;

    logInfo(ctx, 'GET_COLLECTIONS_LIST_BY_IDS_START', {
        collectionIds: await Utils.macrotasksMap(collectionIds, (id) => Utils.encodeId(id)),
        includePermissionsInfo,
    });

    if (!skipValidation) {
        validateArgs(args);
    }

    const {tenantId, projectId} = ctx.get('info');

    const models = await CollectionModel.query(getReplica(trx))
        .where({
            [CollectionModelColumn.DeletedAt]: null,
            [CollectionModelColumn.TenantId]: tenantId,
            [CollectionModelColumn.ProjectId]: projectId,
        })
        .whereIn(CollectionModelColumn.CollectionId, collectionIds)
        .timeout(CollectionModel.DEFAULT_QUERY_TIMEOUT);

    const modelsWithPermissions = await Promise.all(
        models.map(async (model) => {
            const {Collection} = registry.common.classes.get();

            const collectionInstance = new Collection({
                ctx,
                model,
            });

            const collection = await checkAndSetCollectionPermission(
                {ctx, trx},
                {collectionInstance, skipCheckPermissions, includePermissionsInfo, permission},
            );

            return collection;
        }),
    );

    ctx.log('GET_COLLECTIONS_LIST_BY_IDS_FINISH', {
        collectionIds: await Utils.macrotasksMap(
            models.map((item) => item.collectionId),
            (id) => Utils.encodeId(id),
        ),
    });

    return modelsWithPermissions;
};
