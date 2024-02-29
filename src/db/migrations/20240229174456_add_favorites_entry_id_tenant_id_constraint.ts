import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE favorites
            ADD CONSTRAINT favorites_entry_id_tenant_id_constraint FOREIGN KEY (entry_id, tenant_id)
            REFERENCES entries(entry_id, tenant_id) ON DELETE CASCADE ON UPDATE CASCADE;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE favorites DROP CONSTRAINT favorites_entry_id_tenant_id_constraint;
    `);
}
