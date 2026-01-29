import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE tenants ADD COLUMN billing_instance_service_updated_at TIMESTAMPTZ DEFAULT NULL;
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE tenants DROP COLUMN billing_instance_service_updated_at;
    `);
}
