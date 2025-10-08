import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE revisions ADD COLUMN version INT2 DEFAULT 0;
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE revisions DROP COLUMN version;
    `);
}
