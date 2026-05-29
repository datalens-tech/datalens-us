import {AppError} from '@gravity-ui/nodekit';
import {raw} from 'objection';

import {OrganizationPermission} from '../../../components/iam';
import {US_ERRORS} from '../../../const';
import {dbTransaction, queryPrimary} from '../../../db';
import {Tenant} from '../../../db/models/new/tenant';
import {registry} from '../../../registry';
import {TenantSettingsValue} from '../../../types/models';
import {ServiceArgs} from '../types';

type UpdateTenantSettingsArgs = {
    key: string;
    value: TenantSettingsValue;
};

export const updateTenantSettings = async (
    {ctx, mainTrx, skipCheckPermissions}: ServiceArgs<'mainTrx'>,
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

    const result = await dbTransaction(
        {trxProvider: Tenant, trx: mainTrx},
        async (transactionTrx) => {
            await processTenantSettings({
                ctx,
                trx: transactionTrx,
                key,
                value,
            });

            const updatedTenant = await queryPrimary(Tenant, transactionTrx)
                .where({tenantId})
                .patch({
                    settings: raw(`jsonb_set(??::jsonb, ?::text[], ?)`, [
                        'settings',
                        `{${key}}`,
                        JSON.stringify(value),
                    ]),
                })
                .returning('*')
                .first();

            if (!updatedTenant) {
                throw new AppError(US_ERRORS.NOT_EXIST_TENANT, {
                    code: US_ERRORS.NOT_EXIST_TENANT,
                });
            }
            return updatedTenant;
        },
    );

    ctx.log('UPDATE_TENANT_SETTINGS_FINISH', {tenantId, key, value});

    return result;
};
