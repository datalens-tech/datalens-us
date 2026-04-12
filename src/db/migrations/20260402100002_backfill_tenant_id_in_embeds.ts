import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        UPDATE embeds
            SET tenant_id = es.tenant_id
            FROM embedding_secrets es
            WHERE es.embedding_secret_id = embeds.embedding_secret_id
                AND embeds.tenant_id IS NULL;

        ALTER TABLE embeds ALTER COLUMN tenant_id SET NOT NULL;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE embeds ALTER COLUMN tenant_id DROP NOT NULL;
    `);
}
