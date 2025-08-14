import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE UNIQUE INDEX CONCURRENTLY entries_uniq_scope_name_conllection_id_idx
            ON entries (scope, name, collection_id);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX CONCURRENTLY entries_uniq_scope_name_conllection_id_idx;
    `);
}

export const config = {
    transaction: false,
};
