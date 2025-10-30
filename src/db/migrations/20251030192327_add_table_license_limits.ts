import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE TABLE license_limits (
            license_limit_id BIGINT NOT NULL PRIMARY KEY DEFAULT get_id(),
            meta JSONB NOT NULL DEFAULT '{}'::jsonb,
            tenant_id TEXT NOT NULL DEFAULT 'common' REFERENCES tenants (tenant_id) ON UPDATE CASCADE ON DELETE CASCADE,
            creators_limit_value INT NOT NULL,
            started_at TIMESTAMPTZ NOT NULL,
            created_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_by TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX license_limits_tenant_id_started_at_idx ON license_limits(tenant_id, started_at);
        CREATE INDEX license_limits_tenant_id_value_creators_idx ON license_limits USING gin (tenant_id, (value ->> 'creators'));

        CREATE TABLE license_keys (
            license_key_id BIGINT NOT NULL PRIMARY KEY DEFAULT get_id(),
            meta JSONB NOT NULL DEFAULT '{}'::jsonb,
            tenant_id TEXT NOT NULL DEFAULT 'common' REFERENCES tenants (tenant_id) ON UPDATE CASCADE ON DELETE CASCADE,
            value TEXT NOT NULL,
            started_at TIMESTAMPTZ NOT NULL,
            ended_at TIMESTAMPTZ NOT NULL,
            created_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX license_keys_tenant_id_started_at_idx ON license_keys(tenant_id, started_at);
        CREATE INDEX license_keys_tenant_id_ended_at_idx ON license_keys(tenant_id, ended_at);

        CREATE TYPE LICENSE_TYPE AS ENUM ('creator', 'viewer');

        CREATE TABLE licenses (
            license_id BIGINT NOT NULL PRIMARY KEY DEFAULT get_id(),
            meta JSONB NOT NULL DEFAULT '{}'::jsonb,
            tenant_id TEXT NOT NULL DEFAULT 'common' REFERENCES tenants (tenant_id) ON UPDATE CASCADE ON DELETE CASCADE,
            user_id TEXT NOT NULL,
            license_type LICENSE_TYPE NOT NULL,
            expires_at TIMESTAMPTZ,
            created_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_by TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE UNIQUE INDEX licenses_tenant_id_license_type_user_id_unique_idx ON licenses(tenant_id, license_type, user_id);
        CREATE INDEX licenses_expires_at_idx ON licenses(expires_at);
        CREATE INDEX licenses_created_at_idx ON licenses(created_at);
        CREATE INDEX licenses_updated_at_idx ON licenses(updated_at);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX licenses_updated_at_idx;
        DROP INDEX licenses_created_at_idx;
        DROP INDEX licenses_expires_at_idx;
        DROP INDEX licenses_tenant_id_license_type_user_id_unique_idx;
        DROP TABLE licenses;
        DROP TYPE LICENSE_TYPE;

        DROP INDEX license_keys_tenant_id_ended_at_idx;
        DROP INDEX license_keys_tenant_id_started_at_idx;
        DROP TABLE license_keys;

        DROP INDEX license_limits_tenant_id_value_creators_idx;
        DROP INDEX license_limits_tenant_id_started_at_idx;
        DROP TABLE license_limits;
    `);
}
