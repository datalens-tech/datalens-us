import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE favorites DROP CONSTRAINT favorites_tenant_id_ref;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE favorites
            ADD CONSTRAINT favorites_tenant_id_ref FOREIGN KEY (tenant_id)
            REFERENCES tenants(tenant_id) ON UPDATE CASCADE ON DELETE CASCADE;
    `);
}
