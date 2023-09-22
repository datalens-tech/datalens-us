import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        CREATE INDEX revisions_meta_mdb_cluster_id_index ON revisions USING gin ((meta ->> 'mdb_cluster_id'));
    `);
};

exports.down = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
         DROP INDEX revisions_meta_mdb_cluster_id_index;
    `);
};
