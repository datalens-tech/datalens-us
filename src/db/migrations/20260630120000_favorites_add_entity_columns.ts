import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        CREATE TYPE favorites_entity_type AS ENUM ('entry', 'workbook', 'collection');

        ALTER TABLE favorites
            ADD COLUMN entity_id BIGINT,
            ADD COLUMN entity_type favorites_entity_type;
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE favorites
            DROP COLUMN entity_type,
            DROP COLUMN entity_id;

        DROP TYPE favorites_entity_type;
    `);
}
