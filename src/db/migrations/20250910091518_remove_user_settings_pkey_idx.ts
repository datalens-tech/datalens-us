import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`ALTER TABLE user_settings DROP CONSTRAINT user_settings_pkey;`);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE user_settings ADD CONSTRAINT user_settings_pkey PRIMARY KEY (user_id);`);
}
