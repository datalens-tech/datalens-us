import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE INDEX CONCURRENTLY entries_tenant_id_scope_created_at_idx
            ON entries(tenant_id, scope, created_at);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX CONCURRENTLY entries_tenant_id_scope_created_at_idx;
    `);
}

export const config = {
    transaction: false,
};
