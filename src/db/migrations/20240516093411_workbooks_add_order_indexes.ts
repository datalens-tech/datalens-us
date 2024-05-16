import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE INDEX workbooks_created_at_idx ON workbooks USING BTREE (created_at);
        CREATE INDEX workbooks_updated_at_idx ON workbooks USING BTREE (updated_at);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX workbooks_updated_at_idx;
        DROP INDEX workbooks_created_at_idx;
    `);
}
