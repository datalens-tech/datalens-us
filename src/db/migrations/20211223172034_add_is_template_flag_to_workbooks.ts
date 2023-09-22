import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        ALTER TABLE workbooks ADD COLUMN is_template BOOLEAN DEFAULT false;
    `);
};

exports.down = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        ALTER TABLE workbooks DROP COLUMN is_template;
    `);
};
