import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        CREATE INDEX revisions_entry_id_idx ON revisions USING BTREE ("entry_id");
    `);
};

exports.down = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        DROP INDEX revisions_entry_id_idx;
    `);
};
