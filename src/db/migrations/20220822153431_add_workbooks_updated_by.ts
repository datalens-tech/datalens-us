import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE workbooks
            ADD COLUMN updated_by TEXT DEFAULT NULL,
            ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE workbooks
            DROP COLUMN updated_by,
            DROP COLUMN updated_at;
    `);
}
