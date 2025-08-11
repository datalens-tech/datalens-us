import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE entries
            ADD CONSTRAINT entries_single_container_constraint 
            CHECK (NOT (workbook_id IS NOT NULL AND collection_id IS NOT NULL)) NOT VALID;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE entries DROP CONSTRAINT entries_single_container_constraint;
    `);
}
