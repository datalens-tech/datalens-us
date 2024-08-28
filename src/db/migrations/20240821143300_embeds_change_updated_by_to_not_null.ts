import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        UPDATE embeds SET updated_by = created_by, updated_at = created_at;
        ALTER TABLE embeds ALTER COLUMN updated_by SET NOT NULL;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE embeds ALTER COLUMN updated_by DROP NOT NULL;
    `);
}
