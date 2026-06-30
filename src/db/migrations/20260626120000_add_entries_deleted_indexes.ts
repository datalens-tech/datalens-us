import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        CREATE INDEX CONCURRENTLY entries_deleted_updated_at_idx
            ON entries (tenant_id, updated_at, entry_id)
            WHERE is_deleted = true
              AND (workbook_id IS NOT NULL OR collection_id IS NOT NULL);
    `);
    await knex.raw(`
        CREATE INDEX CONCURRENTLY entries_deleted_sort_name_idx
            ON entries (tenant_id, sort_name, entry_id)
            WHERE is_deleted = true
              AND (workbook_id IS NOT NULL OR collection_id IS NOT NULL);
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`DROP INDEX CONCURRENTLY entries_deleted_sort_name_idx;`);
    await knex.raw(`DROP INDEX CONCURRENTLY entries_deleted_updated_at_idx;`);
}

export const config = {
    transaction: false,
};
