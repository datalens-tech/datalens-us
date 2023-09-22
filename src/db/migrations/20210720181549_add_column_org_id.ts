import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        ALTER TABLE tenants ADD COLUMN org_id TEXT DEFAULT NULL;
    `);
};

exports.down = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        ALTER TABLE tenants DROP COLUMN IF EXISTS org_id;
    `);
};
