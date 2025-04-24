import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        UPDATE entries
        SET published_id = saved_id
        WHERE published_id IS NULL AND scope = 'widget';
    `);
}

export async function down(): Promise<void> {
    return;
}
