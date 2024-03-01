import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE favorites DROP CONSTRAINT favorites_entries_id;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE favorites
            ADD CONSTRAINT favorites_entries_id FOREIGN KEY (entry_id)
            REFERENCES entries(entry_id)
            ON DELETE CASCADE;      
    `);
}
