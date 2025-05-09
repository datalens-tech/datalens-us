import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE entries
        ALTER COLUMN scope SET NOT NULL;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE entries
        ALTER COLUMN scope DROP NOT NULL;
    `);
}
