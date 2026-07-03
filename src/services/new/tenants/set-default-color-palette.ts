import {raw} from 'objection';

import {NotExistTenantError} from '../../../components/errors';
import {OrganizationPermission} from '../../../components/iam';
import {TenantSettings} from '../../../const';
import {Tenant} from '../../../db/models/new/tenant';
import {registry} from '../../../registry';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';

export interface SetDefaultColorPaletteArgs {
    defaultColorPaletteId: string;
}

export const setDefaultColorPalette = async (
    {ctx, trx, skipCheckPermissions}: ServiceArgs,
    args: SetDefaultColorPaletteArgs,
) => {
    if (!skipCheckPermissions) {
        const {checkOrganizationPermission} = registry.common.functions.get();
        await checkOrganizationPermission({
            ctx,
            permission: OrganizationPermission.ManageInstance,
        });
    }

    const {tenantId} = ctx.get('info');
    const {defaultColorPaletteId} = args;

    ctx.log('SET_DEFAULT_COLOR_PALETTE_START', {
        defaultColorPaletteId,
    });

    const updatedTenant = await Tenant.query(getPrimary(trx))
        .where({tenantId})
        .patch({
            settings: raw(
                `jsonb_set(??, '{${TenantSettings.DefaultColorPaletteId}}', to_jsonb(?::text))`,
                ['settings', defaultColorPaletteId],
            ),
        })
        .returning('*')
        .first()
        .timeout(Tenant.DEFAULT_QUERY_TIMEOUT);

    if (!updatedTenant) {
        throw new NotExistTenantError();
    }

    ctx.log('SET_DEFAULT_COLOR_PALETTE_FINISH', {
        defaultColorPaletteId,
    });

    return updatedTenant;
};
