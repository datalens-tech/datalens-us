import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE TABLE job_operations (
            operation_id BIGINT DEFAULT get_id() PRIMARY KEY,
            current_job_id VARCHAR(255),
            meta JSONB NOT NULL DEFAULT '{}'::jsonb
        );
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP TABLE job_operations;
    `);
}
