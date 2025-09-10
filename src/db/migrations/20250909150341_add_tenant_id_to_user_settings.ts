import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE user_settings 
            ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'common' 
            REFERENCES tenants (tenant_id) ON UPDATE CASCADE ON DELETE CASCADE;
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE user_settings DROP COLUMN tenant_id;
    `);
}
