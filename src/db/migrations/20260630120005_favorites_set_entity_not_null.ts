import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE favorites ALTER COLUMN entity_id SET NOT NULL;
        ALTER TABLE favorites ALTER COLUMN entity_type SET NOT NULL;
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE favorites ALTER COLUMN entity_type DROP NOT NULL;
        ALTER TABLE favorites ALTER COLUMN entity_id DROP NOT NULL;
    `);
}
