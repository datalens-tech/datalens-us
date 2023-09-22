import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX collections_uniq_title_idx;

        ALTER TABLE collections
            ADD COLUMN title_lower TEXT;

        UPDATE collections SET title_lower = lower(title);

        ALTER TABLE collections ALTER COLUMN title_lower SET NOT NULL;

        CREATE UNIQUE INDEX collections_uniq_title_idx
            ON collections (
                COALESCE(parent_id::text, project_id, tenant_id),
                title_lower
            )
            WHERE deleted_at IS NULL;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX collections_uniq_title_idx;

        ALTER TABLE collections
            DROP COLUMN title_lower;

        CREATE UNIQUE INDEX collections_uniq_title_idx
            ON collections (
                COALESCE(parent_id::text, project_id, tenant_id),
                title
            )
            WHERE deleted_at IS NULL;
    `);
}
