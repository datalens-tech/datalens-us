import {AppError} from '@gravity-ui/nodekit';
import {raw, transaction} from 'objection';

import {OrganizationPermission} from '../../../components/iam';
import {US_ERRORS} from '../../../const';
import {Tenant} from '../../../db/models/new/tenant';
import {registry} from '../../../registry';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';

import {getTenant} from './get-tenant';

type UpdateTenantSettingsArgs = {
    key: string;
    value: Nullable<string | boolean>;
};

export const updateTenantSettings = async (
    {ctx, trx, skipCheckPermissions}: ServiceArgs,
    args: UpdateTenantSettingsArgs,
) => {
    if (!skipCheckPermissions) {
        const {checkOrganizationPermission} = registry.common.functions.get();
        await checkOrganizationPermission({
            ctx,
            permission: OrganizationPermission.ManageInstance,
        });
    }

    const {processTenantSettings} = registry.common.functions.get();

    const {tenantId} = ctx.get('info');

    const {key, value} = args;

    ctx.log('UPDATE_TENANT_SETTINGS_START', {tenantId, key, value});

    const tenant = await getTenant({ctx}, {tenantId});

    if (tenant.settings[key] === value) {
        throw new AppError(US_ERRORS.TENANT_SETTINGS_FIELD_ALREADY_SET, {
            code: US_ERRORS.TENANT_SETTINGS_FIELD_ALREADY_SET,
        });
    }

    const result = await transaction(getPrimary(trx), async (transactionTrx) => {
        await processTenantSettings({
            ctx,
            trx: transactionTrx,
            tenantId: tenantId,
            key,
            value,
        });

        const updatedTenant = await Tenant.query(transactionTrx)
            .where({tenantId})
            .patch({
                settings: raw(`jsonb_set(??, '{${key}}', ?)`, ['settings', JSON.stringify(value)]),
            })
            .returning('*')
            .first()
            .timeout(Tenant.DEFAULT_QUERY_TIMEOUT);

        if (!updatedTenant) {
            throw new AppError(US_ERRORS.NOT_EXIST_TENANT, {
                code: US_ERRORS.NOT_EXIST_TENANT,
            });
        }
        return updatedTenant;
    });

    ctx.log('UPDATE_TENANT_SETTINGS_FINISH', {tenantId, key, value});

    return result;
};
