import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE TABLE data_exports (
            data_export_id BIGINT NOT NULL PRIMARY KEY DEFAULT get_id(),
            title TEXT NOT NULL,
            tenant_id TEXT NOT NULL DEFAULT 'common' REFERENCES tenants (tenant_id) ON UPDATE CASCADE ON DELETE CASCADE,
            chart_id BIGINT NOT NULL,
            chart_rev_id BIGINT NOT NULL,
            dataset_id BIGINT,
            dataset_rev_id BIGINT,
            connection_id BIGINT NOT NULL,
            connection_rev_id BIGINT NOT NULL,
            params JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            expired_at TIMESTAMPTZ NOT NULL,
            job_id TEXT NOT NULL,
            result_link TEXT,
            error JSONB
        );

        CREATE INDEX data_exports_chart_id_idx ON data_exports(chart_id);
        CREATE INDEX data_exports_dataset_id_idx ON data_exports(dataset_id);
        CREATE INDEX data_exports_connection_id_idx ON data_exports(connection_id);
        CREATE INDEX data_exports_expired_at_idx ON data_exports(expired_at);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX data_exports_chart_id_idx;
        DROP INDEX data_exports_dataset_id_idx;
        DROP INDEX data_exports_connection_id_idx;
        DROP INDEX data_exports_expired_at_idx;

        DROP TABLE data_exports;
    `);
}
