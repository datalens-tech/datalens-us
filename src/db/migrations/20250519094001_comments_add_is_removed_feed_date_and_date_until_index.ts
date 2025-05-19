import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE INDEX CONCURRENTLY comments_is_removed_feed_lower_date_date_until_idx ON comments (is_removed, lower(feed), date, date_until);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX CONCURRENTLY comments_is_removed_feed_lower_date_date_until_idx;
    `);
}

export const config = {
    transaction: false,
};
