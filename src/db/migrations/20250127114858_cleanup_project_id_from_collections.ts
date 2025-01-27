import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX collections_uniq_title_idx;

        DROP INDEX collections_project_id_idx;
        ALTER TABLE collections DROP COLUMN project_id;

        CREATE UNIQUE INDEX collections_uniq_title_idx
            ON collections (
                COALESCE(parent_id::text, tenant_id),
                title_lower
            )
            WHERE deleted_at IS NULL;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX collections_uniq_title_idx;

        ALTER TABLE collections ADD COLUMN project_id TEXT DEFAULT NULL;
        CREATE INDEX collections_project_id_idx ON collections USING BTREE (project_id);

        CREATE UNIQUE INDEX collections_uniq_title_idx
            ON collections (
                COALESCE(parent_id::text, project_id, tenant_id),
                title_lower
            )
            WHERE deleted_at IS NULL;
    `);
}
