import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
       CREATE TABLE license_quarantines (
            license_quarantine_id BIGINT DEFAULT get_id() PRIMARY KEY,
            license_type license_type_enum NOT NULL,
            started_at TIMESTAMPTZ NOT NULL,
            ends_at TIMESTAMPTZ NOT NULL,
            tenant_id TEXT NOT NULL DEFAULT 'common' REFERENCES tenants (tenant_id) ON UPDATE CASCADE ON DELETE CASCADE,
            meta JSONB NOT NULL DEFAULT '{}'::jsonb
        );

        CREATE INDEX license_quarantines_tenant_id_license_type_ends_at_idx ON license_quarantines(tenant_id, license_type, ends_at);

        ALTER TABLE licenses ADD COLUMN quarantine_id BIGINT REFERENCES license_quarantines(license_quarantine_id) ON DELETE SET NULL;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE licenses DROP COLUMN quarantine_id;
        DROP TABLE license_quarantines;
    `);
}
