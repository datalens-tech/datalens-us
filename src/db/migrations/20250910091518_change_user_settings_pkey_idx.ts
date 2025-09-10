import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE user_settings DROP CONSTRAINT user_settings_pkey, 
            ADD CONSTRAINT user_settings_сomposite_pkey 
            PRIMARY KEY USING INDEX user_settings_tenant_id_user_id_idx;
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE user_settings DROP CONSTRAINT user_settings_сomposite_pkey, 
            ADD CONSTRAINT user_settings_pkey PRIMARY KEY (user_id);
            
        CREATE UNIQUE INDEX user_settings_tenant_id_user_id_idx ON user_settings (tenant_id, user_id);
    `);
}
