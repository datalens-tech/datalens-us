import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE favorites DROP CONSTRAINT favorites_entries_id;

        ALTER TABLE favorites DROP CONSTRAINT favorites_tenant_id_ref;

        ALTER TABLE entries
            ADD CONSTRAINT entries_uniq_entry_id_tenant_id_constraint UNIQUE(entry_id, tenant_id);

        ALTER TABLE favorites
            ADD CONSTRAINT favorites_entry_id_tenant_id_ref FOREIGN KEY (entry_id, tenant_id)
            REFERENCES entries(entry_id, tenant_id) ON DELETE CASCADE ON UPDATE CASCADE;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE favorites DROP CONSTRAINT favorites_entry_id_tenant_id_ref;

        ALTER TABLE entries DROP CONSTRAINT entries_uniq_entry_id_tenant_id_constraint;

        ALTER TABLE favorites
            ADD CONSTRAINT favorites_tenant_id_ref FOREIGN KEY (tenant_id)
            REFERENCES tenants(tenant_id) ON UPDATE CASCADE ON DELETE CASCADE;

        ALTER TABLE favorites
            ADD CONSTRAINT favorites_entries_id FOREIGN KEY (entry_id)
            REFERENCES entries(entry_id)
            ON DELETE CASCADE;
    `);
}
