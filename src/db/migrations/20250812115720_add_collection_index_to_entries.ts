import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE INDEX CONCURRENTLY entries_collection_id_idx ON entries USING BTREE (collection_id);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX CONCURRENTLY entries_collection_id_idx;
    `);
}

export const config = {
    transaction: false,
};
