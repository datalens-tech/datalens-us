import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE entries VALIDATE CONSTRAINT entries_single_container_constraint;
    `);
}

export async function down(): Promise<void> {
    return;
}
