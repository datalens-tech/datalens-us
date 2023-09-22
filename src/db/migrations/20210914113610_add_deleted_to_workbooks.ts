import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        ALTER TABLE workbooks ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
    `);
};

exports.down = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        ALTER TABLE workbooks DROP COLUMN deleted_at;
    `);
};
