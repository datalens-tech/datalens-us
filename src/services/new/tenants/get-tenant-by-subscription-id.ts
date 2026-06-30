import {NotExistEntryError} from '../../../components/errors';
import {Subscription, SubscriptionColumn} from '../../../db/models/new/subscriptions';
import {Tenant, TenantColumn} from '../../../db/models/new/tenant';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

interface GetTenantBySubscriptionIdArgs {
    subscriptionId: string;
}

export const getTenantBySubscriptionId = async (
    {ctx, trx}: ServiceArgs,
    args: GetTenantBySubscriptionIdArgs,
) => {
    const targetTrx = getReplica(trx);

    const {subscriptionId} = args;

    const {tenantId} = ctx.get('info');

    ctx.log('GET_TENANT_BY_SUBSCRIPTION_ID', {tenantId, subscriptionId});

    const tenant = await Tenant.query(targetTrx)
        .select(`${Tenant.tableName}.*`)
        .join(
            Subscription.tableName,
            `${Subscription.tableName}.${SubscriptionColumn.TenantId}`,
            `${Tenant.tableName}.${TenantColumn.TenantId}`,
        )
        .where({
            [`${Subscription.tableName}.${SubscriptionColumn.SubscriptionId}`]: subscriptionId,
        })
        .first()
        .timeout(Tenant.DEFAULT_QUERY_TIMEOUT);

    if (!tenant) {
        throw new NotExistEntryError();
    }

    ctx.log('GET_TENANT_BY_SUBSCRIPTION_ID_SUCCESS');

    return tenant;
};
