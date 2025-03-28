import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE TYPE WORKBOOK_STATUS_ENUM AS ENUM ('active', 'creating', 'deleting', 'deleted');

        ALTER TABLE workbooks ADD COLUMN status WORKBOOK_STATUS_ENUM DEFAULT 'active' NOT NULL;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE workbooks DROP COLUMN status;

        DROP TYPE WORKBOOK_STATUS_ENUM;
    `);
}
