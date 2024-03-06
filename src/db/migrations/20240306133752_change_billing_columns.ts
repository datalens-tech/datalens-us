import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE tenants DROP COLUMN billing_account_id;

        ALTER TABLE tenants DROP COLUMN billing_rate;

        DROP TYPE BILLING_RATE_TYPE;

        ALTER TABLE tenants
            ADD COLUMN billing_paused_by_user BOOLEAN NOT NULL DEFAULT FALSE;

        ALTER TABLE tenants
            ADD COLUMN billing_service_instance_is_active BOOLEAN NOT NULL DEFAULT FALSE;

        ALTER TABLE tenants ADD COLUMN billing_ended_at TIMESTAMPTZ DEFAULT NULL;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE tenants DROP COLUMN billing_ended_at;

        ALTER TABLE tenants
            DROP COLUMN billing_service_instance_is_active;

        ALTER TABLE tenants
            DROP COLUMN billing_paused_by_user;

        CREATE TYPE BILLING_RATE_TYPE AS ENUM ('community', 'business');

        ALTER TABLE tenants ADD COLUMN billing_rate BILLING_RATE_TYPE NOT NULL DEFAULT('community');

        ALTER TABLE tenants ADD COLUMN billing_account_id VARCHAR(255) DEFAULT NULL;
    `);
}
