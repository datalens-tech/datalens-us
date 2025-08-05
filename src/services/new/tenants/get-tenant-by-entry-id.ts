import {AppError} from '@gravity-ui/nodekit';

import {US_ERRORS} from '../../../const';
import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {Tenant, TenantColumn} from '../../../db/models/new/tenant';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

interface GetTenantByEntryIdArgs {
    entryId: string;
}

export const getTenantByEntryId = async ({ctx, trx}: ServiceArgs, args: GetTenantByEntryIdArgs) => {
    const targetTrx = getReplica(trx);

    const {entryId} = args;

    const {tenantId} = ctx.get('info');

    ctx.log('GET_TENANT_BY_ENTRY_ID', {tenantId, entryId});

    const tenant = await Tenant.query(targetTrx)
        .select(`${Tenant.tableName}.*`)
        .join(
            Entry.tableName,
            `${Entry.tableName}.${EntryColumn.TenantId}`,
            `${Tenant.tableName}.${TenantColumn.TenantId}`,
        )
        .where({[`${Entry.tableName}.${EntryColumn.EntryId}`]: entryId})
        .first()
        .timeout(Tenant.DEFAULT_QUERY_TIMEOUT);

    if (!tenant) {
        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
    }

    ctx.log('GET_TENANT_BY_ENTRY_ID_SUCCESS');

    return tenant;
};
