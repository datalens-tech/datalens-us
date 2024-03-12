import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE tenants
            ADD COLUMN billing_paused_by_user BOOLEAN NOT NULL DEFAULT FALSE;

        ALTER TABLE tenants
            ADD COLUMN billing_instance_service_is_active BOOLEAN NOT NULL DEFAULT FALSE;

        ALTER TABLE tenants ADD COLUMN billing_ended_at TIMESTAMPTZ DEFAULT NULL;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE tenants DROP COLUMN billing_ended_at;

        ALTER TABLE tenants
            DROP COLUMN billing_instance_service_is_active;

        ALTER TABLE tenants
            DROP COLUMN billing_paused_by_user;
    `);
}
