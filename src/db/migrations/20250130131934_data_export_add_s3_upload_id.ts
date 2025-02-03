import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE data_exports
        RENAME COLUMN result_link TO s3_key;

        ALTER TABLE data_exports ADD COLUMN upload_id TEXT;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE data_exports
        RENAME COLUMN s3_key TO result_link;

        ALTER TABLE data_exports DROP COLUMN upload_id;
    `);
}
