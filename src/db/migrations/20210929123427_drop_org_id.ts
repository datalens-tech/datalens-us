import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        DROP INDEX tenants_org_id_idx;
        ALTER TABLE tenants DROP COLUMN org_id;
    `);
};

exports.down = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        ALTER TABLE tenants ADD COLUMN org_id TEXT DEFAULT NULL;
        CREATE INDEX tenants_org_id_idx ON tenants USING BTREE ("org_id");
    `);
};
