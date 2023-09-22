import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE tenants
            ADD COLUMN last_init_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            ADD COLUMN retries_count INT NOT NULL DEFAULT 0;
        CREATE INDEX tenants_enabled_idx ON tenants USING BTREE (enabled);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX tenants_enabled_idx;
        ALTER TABLE tenants
            DROP COLUMN last_init_at,
            DROP COLUMN retries_count;
    `);
}
