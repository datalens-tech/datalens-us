import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        CREATE TYPE data_export_status AS ENUM (
            'IN_PROGRESS',
            'CANCELLED',
            'FINISHED',
            'FAILED'
        );

        ALTER TABLE data_exports
            ADD COLUMN status data_export_status NOT NULL DEFAULT 'IN_PROGRESS',
            ADD COLUMN size BIGINT,
            ADD COLUMN finished_at TIMESTAMPTZ,
            ADD COLUMN cancelled_by TEXT,
            ADD COLUMN cancelled_at TIMESTAMPTZ,
            DROP COLUMN title,
            DROP COLUMN updated_by,
            DROP COLUMN updated_at;

        CREATE INDEX idx_data_exports_created_at ON data_exports(created_at);
        CREATE INDEX idx_data_exports_expired_at ON data_exports(expired_at);
        CREATE INDEX idx_data_exports_finished_at ON data_exports(finished_at);
        CREATE INDEX idx_data_exports_status ON data_exports(status);
        CREATE INDEX idx_data_exports_size ON data_exports(size);
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        DROP INDEX idx_data_exports_created_at;
        DROP INDEX idx_data_exports_expired_at;
        DROP INDEX idx_data_exports_finished_at;
        DROP INDEX idx_data_exports_status;
        DROP INDEX idx_data_exports_size;

        ALTER TABLE data_exports
            DROP COLUMN status,
            DROP COLUMN size,
            DROP COLUMN finished_at,
            DROP COLUMN cancelled_by,
            DROP COLUMN cancelled_at,
            ADD COLUMN title TEXT,
            ADD COLUMN updated_by TEXT,
            ADD COLUMN updated_at TIMESTAMPTZ;

        DROP TYPE data_export_status;
    `);
}
