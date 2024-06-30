import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE INDEX entries_updated_at_idx ON entries USING BTREE (updated_at);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX entries_updated_at_idx;
    `);
}
