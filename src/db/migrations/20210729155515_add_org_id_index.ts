import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        CREATE INDEX tenants_org_id_idx ON tenants USING BTREE ("org_id");
    `);
};

exports.down = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        DROP INDEX IF EXISTS tenants_org_id_idx;
    `);
};
