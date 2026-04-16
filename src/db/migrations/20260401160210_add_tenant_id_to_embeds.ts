import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE embeds ADD COLUMN tenant_id TEXT REFERENCES tenants (tenant_id) ON UPDATE CASCADE ON DELETE CASCADE;
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE embeds DROP COLUMN tenant_id;
    `);
}
