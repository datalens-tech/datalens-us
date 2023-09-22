import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        DROP TABLE IF EXISTS drafts;
        DROP TABLE IF EXISTS products;
    `);
};

exports.down = function (): Promise<unknown> {
    return Promise.resolve();
};
