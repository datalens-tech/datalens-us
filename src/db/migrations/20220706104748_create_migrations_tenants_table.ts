import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE tenants
            DROP CONSTRAINT check_both_enabled_and_migrating_is_true,
            DROP COLUMN migrating;

        CREATE TABLE migrations_tenants (
            from_id TEXT NOT NULL,
            to_id TEXT NOT NULL,
            migrating BOOLEAN NOT NULL DEFAULT TRUE,
            migration_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (from_id, to_id)
        );
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE tenants
            ADD COLUMN migrating BOOLEAN NOT NULL DEFAULT FALSE,
            ADD CONSTRAINT check_both_enabled_and_migrating_is_true
                CHECK (NOT (enabled IS TRUE AND migrating IS TRUE));

        DROP TABLE migrations_tenants;
    `);
}
