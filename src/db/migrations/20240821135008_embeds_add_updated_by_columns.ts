import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE embeds
            ADD COLUMN updated_by TEXT,
            ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        UPDATE embeds SET updated_by = created_by, updated_at = created_at;
        CREATE INDEX embeds_updated_at_idx ON embeds USING BTREE (updated_at);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE embeds
            DROP COLUMN updated_at,
            DROP COLUMN updated_by;
    `);
}
