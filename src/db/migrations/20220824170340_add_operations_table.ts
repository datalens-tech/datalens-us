import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE TYPE operation_status_enum AS ENUM ('scheduled', 'failed', 'done');

        CREATE TABLE operations (
            operation_id BIGINT DEFAULT get_id() PRIMARY KEY,
            type TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_by TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            result JSONB NOT NULL DEFAULT '{}'::jsonb,
            status OPERATION_STATUS_ENUM NOT NULL DEFAULT 'scheduled',
            meta JSONB NOT NULL DEFAULT '{}'::jsonb,
            inner_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
            run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            retries_left SMALLINT NOT NULL DEFAULT 3,
            retries_interval_sec INT NOT NULL default 180,
            tenant_id TEXT DEFAULT NULL REFERENCES tenants (tenant_id) ON UPDATE CASCADE ON DELETE CASCADE
        );
    
        CREATE INDEX operations_retries_left_run_after_idx
            ON operations USING BTREE (retries_left, run_after) WHERE status = 'scheduled';
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX operations_retries_left_run_after_idx;

        DROP TABLE operations;
        
        DROP TYPE operation_status_enum;
    `);
}
