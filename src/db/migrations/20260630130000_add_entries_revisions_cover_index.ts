import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        CREATE INDEX CONCURRENTLY entries_entry_id_revisions_cover_idx
            ON entries (entry_id) INCLUDE (saved_id, published_id, scope);
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        DROP INDEX CONCURRENTLY entries_entry_id_revisions_cover_idx;
    `);
}

export const config = {
    transaction: false,
};
