import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE INDEX CONCURRENTLY licenses_quarantine_id_idx ON licenses(quarantine_id);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX CONCURRENTLY licenses_quarantine_id_idx;
    `);
}

export const config = {
    transaction: false,
};
