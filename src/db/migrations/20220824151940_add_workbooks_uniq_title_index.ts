import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE workbooks
            ADD COLUMN title_lower TEXT;

        UPDATE workbooks SET title_lower = split_part(title_uniq, '/', 2)
            WHERE title_uniq IS NOT NULL;

        ALTER TABLE workbooks ALTER COLUMN title_lower SET NOT NULL;

        CREATE UNIQUE INDEX workbooks_uniq_title_idx
            ON workbooks (
                COALESCE(collection_id::text, project_id, tenant_id),
                title_lower
            )
            WHERE deleted_at IS NULL;

        ALTER TABLE workbooks
            DROP CONSTRAINT title_uniq_constraint;

        ALTER TABLE workbooks
            DROP COLUMN title_uniq;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE workbooks ADD COLUMN title_uniq TEXT;

        UPDATE workbooks SET title_uniq = concat(tenant_id, '/', lower(title))
            WHERE project_id IS NULL;

        UPDATE workbooks SET title_uniq = concat(project_id, '/', lower(title))
            WHERE project_id IS NOT NULL;

        ALTER TABLE workbooks ADD CONSTRAINT title_uniq_constraint UNIQUE(title_uniq);

        ALTER TABLE workbooks ALTER COLUMN title_uniq SET NOT NULL;

        DROP INDEX workbooks_uniq_title_idx;

        ALTER TABLE workbooks
            DROP COLUMN title_lower;
    `);
}
