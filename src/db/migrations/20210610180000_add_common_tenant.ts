import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        INSERT INTO tenants ("tenant_id", "meta", "created_at", "enabled", "deleting") VALUES
            ('common', '{}', '2021-09-01 18:00:00.00000+03', 't', 'f')
        ON CONFLICT DO NOTHING;
    `);
};

exports.down = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        DELETE FROM tenants WHERE
            tenant_id = 'common'
            AND created_at = '2021-09-01 18:00:00.00000+03';
    `);
};
