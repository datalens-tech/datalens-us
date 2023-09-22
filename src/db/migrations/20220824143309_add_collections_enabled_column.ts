import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE tenants
            ADD COLUMN collections_enabled BOOLEAN NOT NULL DEFAULT FALSE;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE tenants
            DROP COLUMN collections_enabled;
    `);
}
