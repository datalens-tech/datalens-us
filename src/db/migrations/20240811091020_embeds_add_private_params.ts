import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE embeds ADD COLUMN private_params TEXT[] NOT NULL DEFAULT '{}';
        ALTER TABLE embeds ADD COLUMN private_params_enabled BOOLEAN NOT NULL DEFAULT FALSE;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE embeds DROP COLUMN private_params_enabled;
        ALTER TABLE embeds DROP COLUMN private_params;
    `);
}
