import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE tenants DROP COLUMN billing_account_id;

        ALTER TABLE tenants DROP COLUMN billing_rate;

        DROP TYPE BILLING_RATE_TYPE;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE TYPE BILLING_RATE_TYPE AS ENUM ('community', 'business');

        ALTER TABLE tenants ADD COLUMN billing_rate BILLING_RATE_TYPE NOT NULL DEFAULT('community');

        ALTER TABLE tenants ADD COLUMN billing_account_id VARCHAR(255) DEFAULT NULL;
    `);
}
