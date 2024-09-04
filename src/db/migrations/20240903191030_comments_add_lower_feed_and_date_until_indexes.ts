import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE INDEX comments_feed_lower_is_removed_date_date_until_idx ON comments (is_removed, lower(feed collate "en_US.utf8"), date, date_until);
        CREATE INDEX comments_date_until_idx ON comments (date_until);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX comments_date_until_idx;
        DROP INDEX comments_feed_lower_is_removed_date_date_until_idx;
    `);
}
