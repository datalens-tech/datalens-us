import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE tenants ADD COLUMN trial_without_billing BOOLEAN DEFAULT NULL;
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE tenants DROP COLUMN trial_without_billing;
    `);
}
