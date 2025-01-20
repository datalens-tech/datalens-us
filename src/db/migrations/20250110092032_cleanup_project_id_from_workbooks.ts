import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX workbooks_uniq_title_idx;

        DROP INDEX workbooks_project_id_idx;
        ALTER TABLE workbooks DROP COLUMN project_id;

        CREATE UNIQUE INDEX workbooks_uniq_title_idx
            ON workbooks (
                COALESCE(collection_id::text, tenant_id),
                title_lower
            )
            WHERE deleted_at IS NULL;    
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX workbooks_uniq_title_idx;

        ALTER TABLE workbooks ADD COLUMN project_id TEXT DEFAULT NULL;
        CREATE INDEX workbooks_project_id_idx ON workbooks USING BTREE (project_id);

        CREATE UNIQUE INDEX workbooks_uniq_title_idx
            ON workbooks (
                COALESCE(collection_id::text, project_id, tenant_id),
                title_lower
            )
            WHERE deleted_at IS NULL;
    `);
}
