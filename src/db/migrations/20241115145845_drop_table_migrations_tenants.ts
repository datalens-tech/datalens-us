import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP TABLE migrations_tenants;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
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
