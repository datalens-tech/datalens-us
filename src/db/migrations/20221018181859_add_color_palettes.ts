import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE TABLE color_palettes (
            palette_id BIGINT DEFAULT get_id() PRIMARY KEY,
            tenant_id TEXT NOT NULL DEFAULT 'common' REFERENCES tenants (tenant_id) ON UPDATE CASCADE ON DELETE CASCADE,
            name TEXT NOT NULL,
            display_name TEXT NOT NULL,
            colors JSONB NOT NULL DEFAULT '[]'::jsonb,
            is_gradient BOOLEAN NOT NULL DEFAULT false,
            is_default BOOLEAN NOT NULL DEFAULT false
        );

        CREATE INDEX color_palettes_tenant_id_idx ON color_palettes(tenant_id);

        ALTER TABLE color_palettes ADD CONSTRAINT color_palettes_uniq_name_constraint UNIQUE(tenant_id, name);

        CREATE UNIQUE INDEX color_palettes_uniq_default_for_tenant_id_idx ON color_palettes (
            tenant_id,
            is_default,
            is_gradient
        ) WHERE is_default = TRUE;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX color_palettes_uniq_default_for_tenant_id_idx;

        ALTER TABLE color_palettes DROP CONSTRAINT color_palettes_uniq_name_constraint;

        DROP INDEX color_palettes_tenant_id_idx;

        DROP TABLE color_palettes;
    `);
}
