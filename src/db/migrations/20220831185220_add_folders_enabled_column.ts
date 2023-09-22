import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE tenants
            ADD COLUMN folders_enabled BOOLEAN NOT NULL DEFAULT TRUE;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE tenants
            DROP COLUMN folders_enabled;
    `);
}
