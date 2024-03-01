import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE entries
            ADD CONSTRAINT entries_uniq_entry_id_tenant_id_constraint UNIQUE(entry_id, tenant_id);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE entries DROP CONSTRAINT entries_uniq_entry_id_tenant_id_constraint;
    `);
}
