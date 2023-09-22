import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE favorites
            ADD CONSTRAINT favorites_tenant_id_ref FOREIGN KEY (tenant_id)
            REFERENCES tenants(tenant_id) ON UPDATE CASCADE ON DELETE CASCADE;

        ALTER TABLE tenants
            ADD COLUMN migrating BOOLEAN NOT NULL DEFAULT FALSE,
            ADD CONSTRAINT check_both_enabled_and_migrating_is_true
                CHECK (NOT (enabled IS TRUE AND migrating IS TRUE));
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE favorites DROP CONSTRAINT favorites_tenant_id_ref;

        ALTER TABLE tenants
            DROP CONSTRAINT check_both_enabled_and_migrating_is_true,
            DROP COLUMN migrating;
    `);
}
