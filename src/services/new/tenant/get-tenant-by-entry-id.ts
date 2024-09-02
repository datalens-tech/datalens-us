import {ServiceArgs} from '../types';
import {AppError} from '@gravity-ui/nodekit';
import {logInfo} from '../../../utils';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {Tenant, TenantColumn} from '../../../db/models/new/tenant';
import {Entry, EntryColumn} from '../../../db/models/new/entry';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['entryId'],
    properties: {
        entryId: {
            type: 'string',
        },
    },
});

interface GetTenantByEntryIdArgs {
    entryId: string;
}

export const getTenantByEntryId = async (
    {ctx, trx}: ServiceArgs,
    args: GetTenantByEntryIdArgs,
    skipValidation = false,
) => {
    const targetTrx = trx ?? Tenant.replica;

    const {entryId} = args;

    const {tenantId} = ctx.get('info');

    logInfo(ctx, 'GET_TENANT_BY_ENTRY_ID', {tenantId, entryId});

    if (!skipValidation) {
        validateArgs(args);
    }

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
        throw new AppError('NOT_EXISTS_TENANT_BY_ENTRY_ID', {
            code: 'NOT_EXISTS_TENANT_BY_ENTRY_ID',
        });
    }

    logInfo(ctx, 'GET_TENANT_BY_ENTRY_ID_SUCCESS');

    return tenant;
};
