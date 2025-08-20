import {AppError} from '@gravity-ui/nodekit';
import {raw} from 'objection';

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
    if (!skipCheckPermissions) {
        const {checkOrganizationPermission} = registry.common.functions.get();
        await checkOrganizationPermission({
            ctx,
            permission: OrganizationPermission.ManageInstance,
        });
    }

    const {tenantId} = ctx.get('info');

    const {key, value} = args;

    ctx.log('UPDATE_TENANT_SETTINGS_START', {tenantId, [key]: value});

    const result = await Tenant.query(getPrimary(trx))
        .where({tenantId})
        .patch({
            settings: raw(`jsonb_set(??, '{${key}}', ?)`, ['settings', JSON.stringify(value)]),
        })
        .returning('*')
        .first()
        .timeout(Tenant.DEFAULT_QUERY_TIMEOUT);

    if (!result) {
        throw new AppError(US_ERRORS.NOT_EXIST_TENANT, {
            code: US_ERRORS.NOT_EXIST_TENANT,
        });
    }

    ctx.log('UPDATE_TENANT_SETTINGS_FINISH', {tenantId, [key]: value});

    return result;
};
