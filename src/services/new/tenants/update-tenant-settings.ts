import {AppError} from '@gravity-ui/nodekit';
import {raw, transaction} from 'objection';

import {OrganizationPermission} from '../../../components/iam';
import {US_ERRORS} from '../../../const';
import {Tenant} from '../../../db/models/new/tenant';
import {registry} from '../../../registry';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';

type UpdateTenantSettingsArgs = {
    key: string;
    value: Nullable<string | boolean>;
};

export const updateTenantSettings = async (
    {ctx, trx, skipCheckPermissions}: ServiceArgs,
    args: UpdateTenantSettingsArgs,
) => {
    const {checkOrganizationPermission, processTenantSettings} = registry.common.functions.get();

    if (!skipCheckPermissions) {
        await checkOrganizationPermission({
            ctx,
            permission: OrganizationPermission.ManageInstance,
        });
    }

    const {tenantId} = ctx.get('info');

    const {key, value} = args;

    ctx.log('UPDATE_TENANT_SETTINGS_START', {tenantId, key, value});

    const result = await transaction(getPrimary(trx), async (transactionTrx) => {
        await processTenantSettings({
            ctx,
            trx: transactionTrx,
            tenantId,
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
