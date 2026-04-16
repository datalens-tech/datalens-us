import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        UPDATE embedding_secrets
            SET tenant_id = w.tenant_id
            FROM workbooks w
            WHERE w.workbook_id = embedding_secrets.workbook_id
                AND embedding_secrets.tenant_id IS NULL;

        ALTER TABLE embedding_secrets ALTER COLUMN tenant_id SET NOT NULL;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE embedding_secrets ALTER COLUMN tenant_id DROP NOT NULL;
    `);
}
