import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE INDEX CONCURRENTLY entries_display_key_idx ON entries USING BTREE(display_key text_pattern_ops);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX CONCURRENTLY entries_display_key_idx;
    `);
}

export const config = {
    transaction: false,
};
