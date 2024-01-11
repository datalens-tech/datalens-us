import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE INDEX states_entry_id_idx ON states(entry_id);

        CREATE INDEX locks_entry_id_idx ON locks(entry_id);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX locks_entry_id_idx;

        DROP INDEX states_entry_id_idx;
    `);
}
