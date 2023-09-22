import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        ALTER TABLE entries ADD COLUMN unversioned_data jsonb DEFAULT '{}'::jsonb;
    `);
};

exports.down = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        ALTER TABLE entries DROP COLUMN unversioned_data;
    `);
};
