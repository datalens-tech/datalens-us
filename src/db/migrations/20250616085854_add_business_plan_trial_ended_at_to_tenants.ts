import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE tenants ADD COLUMN trial_ended_at TIMESTAMPTZ DEFAULT NULL;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE tenants DROP COLUMN trial_ended_at;
    `);
}
