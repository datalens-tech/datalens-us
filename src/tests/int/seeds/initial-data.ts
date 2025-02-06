import type {Knex} from 'knex';

import {testTenantId} from '../auth';

export const seed = async (knex: Knex) => {
    await knex('tenants')
        .insert({
            tenantId: testTenantId,
            meta: {},
            enabled: true,
            createdAt: '2021-09-01 18:00:00.00000+03',
        })
        .onConflict('tenantId')
        .merge();
};
