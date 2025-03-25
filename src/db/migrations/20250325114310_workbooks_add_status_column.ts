import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE TYPE WORKBOOK_STATUS_ENUM AS ENUM ('importing');

        ALTER TABLE workbooks ADD COLUMN status WORKBOOK_STATUS_ENUM DEFAULT NULL;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE workbooks DROP COLUMN status;

        DROP TYPE WORKBOOK_STATUS_ENUM;
    `);
}
