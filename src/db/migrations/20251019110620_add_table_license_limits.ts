import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE TABLE license_limits (
            license_limit_id BIGINT NOT NULL PRIMARY KEY DEFAULT get_id(),
            tenant_id TEXT NOT NULL DEFAULT 'common' REFERENCES tenants (tenant_id) ON UPDATE CASCADE ON DELETE CASCADE,
            limit_value INT NOT NULL,
            started_at TIMESTAMPTZ NOT NULL,
            created_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_by TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX license_limits_tenant_id_started_at_idx ON license_limits(tenant_id, started_at);

        CREATE TYPE LICENSE_TYPE AS ENUM ('creator', 'visitor');

        CREATE TABLE license_assignments (
            license_assignment_id BIGINT NOT NULL PRIMARY KEY DEFAULT get_id(),
            tenant_id TEXT NOT NULL DEFAULT 'common' REFERENCES tenants (tenant_id) ON UPDATE CASCADE ON DELETE CASCADE,
            user_id TEXT NOT NULL,
            license_type LICENSE_TYPE NOT NULL,
            expired_at TIMESTAMPTZ,
            created_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_by TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE UNIQUE INDEX license_assignments_tenant_id_user_id_idx ON license_assignments(tenant_id, user_id);
        CREATE INDEX license_assignments_expired_at_idx ON license_assignments(expired_at);
        CREATE INDEX license_assignments_created_at_idx ON license_assignments(created_at);
        CREATE INDEX license_assignments_updated_at_idx ON license_assignments(updated_at);

    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX license_assignments_updated_at_idx;
        DROP INDEX license_assignments_created_at_idx;
        DROP INDEX license_assignments_expired_at_idx;
        DROP INDEX license_assignments_tenant_id_user_id_idx;
        DROP TABLE license_assignments;
        DROP TYPE LICENSE_TYPE;

        DROP INDEX license_limits_tenant_id_started_at_idx;
        DROP TABLE license_limits;
    `);
}
