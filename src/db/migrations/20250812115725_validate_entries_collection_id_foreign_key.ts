import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE entries VALIDATE CONSTRAINT entries_collection_id_ref;
    `);
}

export async function down(): Promise<void> {
    return;
}
