import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE INDEX revisions_updated_at_idx ON revisions USING BTREE (updated_at);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX revisions_updated_at_idx;
    `);
}
