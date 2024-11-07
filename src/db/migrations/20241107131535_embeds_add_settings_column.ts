import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE embeds ADD COLUMN settings jsonb DEFAULT '{}'::jsonb;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE embeds DROP COLUMN settings;
    `);
}
