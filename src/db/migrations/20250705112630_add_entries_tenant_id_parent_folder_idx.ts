import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE INDEX CONCURRENTLY entries_tenant_id_parent_folder_idx ON entries (tenant_id, RTRIM(RTRIM(key, '/'), name));
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX CONCURRENTLY entries_tenant_id_parent_folder_idx;
    `);
}

export const config = {
    transaction: false,
};
