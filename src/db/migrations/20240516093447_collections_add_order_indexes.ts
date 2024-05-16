import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE INDEX collections_created_at_idx ON collections USING BTREE (created_at);
        CREATE INDEX collections_updated_at_idx ON collections USING BTREE (updated_at);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX collections_updated_at_idx;
        DROP INDEX collections_created_at_idx;
    `);
}
