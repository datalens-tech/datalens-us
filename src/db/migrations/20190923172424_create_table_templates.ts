import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<any> {
    return knex.raw(`
        CREATE TABLE templates (
            name text PRIMARY KEY,
            data JSONB DEFAULT null
        );
    `);
};

exports.down = function (knex: Knex): Promise<any> {
    return knex.raw(`
        DROP TABLE templates;
    `);
};
