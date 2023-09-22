import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE locks DROP COLUMN is_new;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE locks ADD COLUMN is_new BOOLEAN DEFAULT false;
    `);
}
