import {ServiceArgs} from '../types';
import {AppError} from '@gravity-ui/nodekit';
import {logInfo} from '../../../utils';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {Tenant, TenantColumn} from '../../../db/models/new/tenant';
import {CollectionModel, CollectionModelColumn} from '../../../db/models/new/collection';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['collectionId'],
    properties: {
        collectionId: {
            type: 'string',
        },
    },
});

interface GetTenantByCollectionIdArgs {
    collectionId: string;
}

export const getTenantByCollectionId = async (
    {ctx, trx}: ServiceArgs,
    args: GetTenantByCollectionIdArgs,
    skipValidation = false,
) => {
    const targetTrx = trx ?? Tenant.replica;

    const {collectionId} = args;

    const {tenantId} = ctx.get('info');

    logInfo(ctx, 'GET_TENANT_BY_COLLECTION_ID', {tenantId, collectionId});

    if (!skipValidation) {
        validateArgs(args);
    }

    const tenant = await Tenant.query(targetTrx)
        .select(`${Tenant.tableName}.*`)
        .join(
            CollectionModel.tableName,
            `${CollectionModel.tableName}.${CollectionModelColumn.TenantId}`,
            `${Tenant.tableName}.${TenantColumn.TenantId}`,
        )
        .where({
            [`${CollectionModel.tableName}.${CollectionModelColumn.CollectionId}`]: collectionId,
        })
        .first()
        .timeout(Tenant.DEFAULT_QUERY_TIMEOUT);

    if (!tenant) {
        throw new AppError('NOT_EXISTS_TENANT_BY_COLLECTION_ID', {
            code: 'NOT_EXISTS_TENANT_BY_COLLECTION_ID',
        });
    }

    logInfo(ctx, 'GET_TENANT_BY_COLLECTION_ID_SUCCESS');

    return tenant;
};
