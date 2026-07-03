import {NotExistTenantError} from '../../../components/errors';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {Tenant, TenantColumn} from '../../../db/models/new/tenant';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

// TODO: remove ajv validation
const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['tenantId'],
    properties: {
        tenantId: {
            type: 'string',
        },
    },
});

export interface GetTenantArgs {
    tenantId: string;
}

export const getTenant = async (
    {ctx, trx}: ServiceArgs,
    args: GetTenantArgs,
    skipValidation = false,
) => {
    const {tenantId} = args;

    ctx.log('GET_TENANT_REQUEST', {tenantId});

    if (!skipValidation) {
        validateArgs(args);
    }

    const tenant = await Tenant.query(getReplica(trx))
        .findOne(TenantColumn.TenantId, tenantId)
        .timeout(Tenant.DEFAULT_QUERY_TIMEOUT);

    if (tenant === undefined) {
        throw new NotExistTenantError();
    }

    ctx.log('GET_TENANT_SUCCESS', {tenantId});

    return tenant;
};
