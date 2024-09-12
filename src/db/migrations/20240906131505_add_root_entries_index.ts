import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE INDEX CONCURRENTLY entries_root_tenant_id_idx
            ON entries(tenant_id)
            WHERE
                key NOT LIKE '_%/_%';
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX entries_root_tenant_id_idx;
    `);
}

export const config = {
    transaction: false,
};
