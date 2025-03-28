import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE INDEX CONCURRENTLY tenant_id_folder_scope_idx ON entries(tenant_id, (CASE WHEN scope = 'folder' THEN 0 ELSE 1 END));
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX CONCURRENTLY tenant_id_folder_scope_idx;
    `);
}

export const config = {
    transaction: false,
};
