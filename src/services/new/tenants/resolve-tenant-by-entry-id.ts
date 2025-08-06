import {AppError} from '@gravity-ui/nodekit';

import {US_ERRORS} from '../../../const';
import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {Tenant, TenantColumn} from '../../../db/models/new/tenant';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

type ResolveTenantByEntryIdArgs = {
    entryId: string;
};

export const resolveTenantByEntryId = async (
    {ctx, trx}: ServiceArgs,
    args: ResolveTenantByEntryIdArgs,
) => {
    const {entryId} = args;

    ctx.log('RESOLVE_TENANT_BY_ENTRY_ID_REQUEST', {entryId});

    const tenant = await Tenant.query(getReplica(trx))
        .select(`${Tenant.tableName}.*`)
        .join(
            Entry.tableName,
            `${Entry.tableName}.${EntryColumn.TenantId}`,
            `${Tenant.tableName}.${TenantColumn.TenantId}`,
        )
        .where(`${Entry.tableName}.${EntryColumn.EntryId}`, entryId)
        .first()
        .timeout(Tenant.DEFAULT_QUERY_TIMEOUT);

    if (tenant === undefined) {
        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
    }

    ctx.log('RESOLVE_TENANT_BY_ENTRY_ID_SUCCESS', {tenantId: tenant[TenantColumn.TenantId]});

    return tenant;
};
