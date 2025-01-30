import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE INDEX CONCURRENTLY entries_tenant_id_scope_idx
            ON entries(tenant_id, scope);
`);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`DROP INDEX entries_tenant_id_scope_idx;`);
}

export const config = {
    transaction: false,
};
