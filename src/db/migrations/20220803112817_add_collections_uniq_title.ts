import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE UNIQUE INDEX collections_uniq_title_idx
            ON collections (
                COALESCE(parent_id::text, project_id, tenant_id),
                title
            )
            WHERE deleted_at IS NULL;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX collections_uniq_title_idx;
    `);
}
