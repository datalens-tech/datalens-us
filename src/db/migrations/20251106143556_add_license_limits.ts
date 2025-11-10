import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE TYPE license_limit_type_enum AS ENUM ('regular', 'forced');

        CREATE TABLE license_limits (
            license_limit_id BIGINT NOT NULL PRIMARY KEY DEFAULT get_id(),
            meta JSONB NOT NULL DEFAULT '{}'::jsonb,
            tenant_id TEXT NOT NULL DEFAULT 'common' REFERENCES tenants (tenant_id) ON UPDATE CASCADE ON DELETE CASCADE,
            type license_limit_type_enum NOT NULL,
            started_at TIMESTAMPTZ NOT NULL,
            creators_limit_value INT NOT NULL,
            created_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_by TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX license_limits_tenant_id_started_at_desc_idx ON license_limits(tenant_id, started_at DESC);
        CREATE INDEX license_limits_started_at_idx ON license_limits(started_at);
        CREATE INDEX license_limits_creators_limit_value_idx ON license_limits(creators_limit_value);

        CREATE TYPE license_type_enum AS ENUM ('creator', 'viewer');

        CREATE TABLE licenses (
            license_id BIGINT NOT NULL PRIMARY KEY DEFAULT get_id(),
            meta JSONB NOT NULL DEFAULT '{}'::jsonb,
            tenant_id TEXT NOT NULL DEFAULT 'common' REFERENCES tenants (tenant_id) ON UPDATE CASCADE ON DELETE CASCADE,
            user_id TEXT NOT NULL,
            license_type license_type_enum NOT NULL,
            expires_at TIMESTAMPTZ,
            created_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_by TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE UNIQUE INDEX licenses_tenant_id_user_id_license_type_unique_idx ON licenses(tenant_id, user_id, license_type);
        CREATE INDEX licenses_tenant_id_license_type_expires_at_idx ON licenses(tenant_id, license_type, expires_at);
        CREATE INDEX licenses_tenant_id_expires_at_idx ON licenses(tenant_id, expires_at);
        CREATE INDEX licenses_tenant_id_created_at_idx ON licenses(tenant_id, created_at);
        CREATE INDEX licenses_tenant_id_updated_at_idx ON licenses(tenant_id, updated_at);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX licenses_tenant_id_updated_at_idx;
        DROP INDEX licenses_tenant_id_created_at_idx;
        DROP INDEX licenses_tenant_id_expires_at_idx;
        DROP INDEX licenses_tenant_id_license_type_expires_at_idx;
        DROP INDEX licenses_tenant_id_user_id_license_type_unique_idx;
        DROP TABLE licenses;
        DROP TYPE license_type_enum;

        DROP INDEX license_limits_creators_limit_value_idx;
        DROP INDEX license_limits_started_at_idx;
        DROP INDEX license_limits_tenant_id_started_at_desc_idx;
        DROP TABLE license_limits;
        DROP TYPE license_limit_type_enum;
    `);
}
