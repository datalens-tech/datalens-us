import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE entries ADD COLUMN mirrored BOOLEAN DEFAULT false;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE entries DROP COLUMN mirrored;
    `);
}
