import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX CONCURRENTLY comments_feed_lower_is_removed_date_date_until_idx;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE INDEX CONCURRENTLY comments_feed_lower_is_removed_date_date_until_idx ON comments (is_removed, lower(feed), date, date_until);
    `);
}

export const config = {
    transaction: false,
};
