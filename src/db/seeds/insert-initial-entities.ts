import type {Knex} from 'knex';
import {testTenantId} from '../../tests/int/constants';

export const seed = async (knex: Knex) => {
    const curTenantId = testTenantId;

    const entitiesWillCreate = [
        {
            key: '__trash/',
            displayKey: '__trash/',
            scope: 'folder',
            tenantId: curTenantId,
            type: '',
            innerMeta: {},
            meta: {},
            data: {},
            createdBy: 'system',
            updatedBy: 'system',
            hidden: true,
        },
        {
            key: '__system/',
            displayKey: '__system/',
            scope: 'folder',
            tenantId: curTenantId,
            type: '',
            innerMeta: {},
            meta: {},
            data: {},
            createdBy: 'system',
            updatedBy: 'system',
            hidden: true,
        },
        {
            key: '__system/connections/',
            displayKey: '__system/connections/',
            scope: 'folder',
            tenantId: curTenantId,
            type: '',
            innerMeta: {},
            meta: {},
            data: {},
            createdBy: 'system',
            updatedBy: 'system',
            hidden: true,
        },
        {
            key: 'users/',
            displayKey: 'Users/',
            scope: 'folder',
            tenantId: curTenantId,
            type: '',
            innerMeta: {},
            meta: {},
            data: {},
            createdBy: 'system',
            updatedBy: 'system',
            hidden: false,
        },
    ];

    await knex('tenants').insert([
        {
            tenantId: curTenantId,
            meta: {cloudId: 'test-cloud-id'},
            enabled: true,
            billingStartedAt: new Date().toUTCString(),
            billingInstanceServiceIsActive: true,
        },
    ]);

    const commonTenantId = 'common';

    await knex('color_palettes').insert([
        {
            tenantId: commonTenantId,
            name: 'plain palette 1',
            displayName: 'Plain palette 1',
            colors: JSON.stringify([
                '#4DA2F1',
                '#FF3D64',
                '#8AD554',
                '#FFC636',
                '#FFB9DD',
                '#84D1EE',
                '#FF91A1',
                '#54A520',
                '#DB9100',
            ]) as any,
            isGradient: false,
            isDefault: true,
        },
        {
            tenantId: commonTenantId,
            name: 'plain palette 2',
            displayName: 'Plain palette 2',
            colors: JSON.stringify([
                '#BA74B3',
                '#1F68A9',
                '#ED65A9',
                '#0FA08D',
                '#FF7E00',
                '#E8B0A4',
                '#52A6C5',
                '#BE2443',
                '#70C1AF',
                '#FFB46C',
                '#DCA3D7',
            ]) as any,
            isGradient: false,
            isDefault: false,
        },
        {
            tenantId: commonTenantId,
            name: 'gradient palette 1',
            displayName: 'Gradient palette 1',
            colors: JSON.stringify(['#4DA2F1', '#84D1EE']) as any,
            isGradient: true,
            isDefault: true,
        },
        {
            tenantId: commonTenantId,
            name: 'gradient palette 2',
            displayName: 'Gradient palette 2',
            colors: JSON.stringify(['#FFC636', '#84D1EE']) as any,
            isGradient: true,
            isDefault: false,
        },
    ]);

    return await Promise.all(
        entitiesWillCreate.map(async (entity) => {
            const {
                key,
                displayKey,
                scope,
                tenantId,
                type,
                innerMeta,
                meta,
                data,
                createdBy,
                updatedBy,
                hidden,
            } = entity;

            const ids = await knex.raw('select get_id() as entry_id, get_id() as rev_id;');
            const {entry_id: entryId, rev_id: revId} = ids.rows[0];

            await knex('entries').insert({
                entryId,
                savedId: revId,
                publishedId: revId,
                key,
                displayKey,
                tenantId,
                scope,
                type,
                innerMeta,
                createdBy,
                updatedBy,
                hidden,
            });

            return await knex('revisions').insert({
                revId,
                entryId,
                meta,
                data,
                createdBy: createdBy,
                updatedBy: updatedBy,
            });
        }),
    ).catch((err) => {
        throw err;
    });
};
