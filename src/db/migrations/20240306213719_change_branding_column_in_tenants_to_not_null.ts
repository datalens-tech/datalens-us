import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        ALTER TABLE tenants DROP COLUMN branding;

        ALTER TABLE tenants ADD COLUMN branding jsonb NOT NULL DEFAULT '{}'::jsonb;
    `);
};

exports.down = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        ALTER TABLE tenants DROP COLUMN branding;
        
        ALTER TABLE tenants ADD COLUMN branding jsonb DEFAULT '{}'::jsonb;
    `);
};
