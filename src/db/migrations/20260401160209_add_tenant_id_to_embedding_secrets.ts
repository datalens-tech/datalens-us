import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE embedding_secrets ADD COLUMN tenant_id TEXT REFERENCES tenants (tenant_id) ON UPDATE CASCADE ON DELETE CASCADE;
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE embedding_secrets DROP COLUMN tenant_id;
    `);
}
