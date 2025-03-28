import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE INDEX CONCURRENTLY entries_created_by_idx ON entries USING btree(created_by);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX CONCURRENTLY entries_created_by_idx;
    `);
}

export const config = {
    transaction: false,
};
