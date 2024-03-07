import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        ALTER TABLE tenants ALTER COLUMN branding SET NOT NULL;
    `);
};

exports.down = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        ALTER TABLE tenants ALTER COLUMN branding DROP NOT NULL;
    `);
};
