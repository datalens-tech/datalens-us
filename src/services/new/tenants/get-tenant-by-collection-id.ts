import {NotExistEntryError} from '../../../components/errors';
import {CollectionModel, CollectionModelColumn} from '../../../db/models/new/collection';
import {Tenant, TenantColumn} from '../../../db/models/new/tenant';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

interface GetTenantByCollectionIdArgs {
    collectionId: string;
}

export const getTenantByCollectionId = async (
    {ctx, trx}: ServiceArgs,
    args: GetTenantByCollectionIdArgs,
) => {
    const targetTrx = getReplica(trx);

    const {collectionId} = args;

    const {tenantId} = ctx.get('info');

    ctx.log('GET_TENANT_BY_COLLECTION_ID', {tenantId, collectionId});

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
        throw new NotExistEntryError();
    }

    ctx.log('GET_TENANT_BY_COLLECTION_ID_SUCCESS');

    return tenant;
};
