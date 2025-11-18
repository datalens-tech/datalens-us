import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE revisions ADD COLUMN version INT;
        ALTER TABLE revisions ADD COLUMN source_version INT;
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE revisions DROP COLUMN version;
        ALTER TABLE revisions DROP COLUMN source_version;
    `);
}
