import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE embeds ADD COLUMN private_params TEXT[] NOT NULL DEFAULT '{}';
        ALTER TABLE embeds ADD COLUMN public_params_mode BOOLEAN NOT NULL DEFAULT TRUE;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE embeds DROP COLUMN public_params_mode;
        ALTER TABLE embeds DROP COLUMN private_params;
    `);
}
