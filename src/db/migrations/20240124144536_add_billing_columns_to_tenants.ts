import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE TYPE BILLING_RATE_TYPE AS ENUM ('community', 'business');

        ALTER TABLE tenants ADD COLUMN billing_rate BILLING_RATE_TYPE not null default('community');

        ALTER TABLE tenants ADD COLUMN account_billing_id BIGINT DEFAULT NULL;

        ALTER TABLE tenants ADD COLUMN instance_service_billing_id BIGINT DEFAULT NULL;

        ALTER TABLE tenants ADD COLUMN billing_started_at TIMESTAMPTZ DEFAULT NULL;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE tenants DROP COLUMN billing_rate;

        ALTER TABLE tenants DROP COLUMN account_billing_id;

        ALTER TABLE tenants DROP COLUMN instance_service_billing_id;

        ALTER TABLE tenants DROP COLUMN billing_started_at;

        DROP TYPE IF EXISTS BILLING_RATE_TYPE;
    `);
}
