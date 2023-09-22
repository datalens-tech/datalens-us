import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        CREATE TABLE workbooks (
            workbook_id BIGINT DEFAULT get_id() PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            project_id TEXT,
            tenant_id TEXT NOT NULL DEFAULT 'common' REFERENCES tenants (tenant_id) ON UPDATE CASCADE ON DELETE CASCADE,
            meta JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        ALTER TABLE entries ADD COLUMN workbook_id BIGINT;

        CREATE INDEX workbooks_project_id_idx ON workbooks USING BTREE (project_id);
        CREATE INDEX workbooks_tenant_id_idx ON workbooks USING BTREE (tenant_id);
        CREATE INDEX entries_workbook_id_idx ON entries USING BTREE (workbook_id);
    `);
};

exports.down = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        DROP INDEX entries_workbook_id_idx;
        DROP INDEX workbooks_tenant_id_idx;
        DROP INDEX workbooks_project_id_idx;

        ALTER TABLE entries DROP COLUMN workbook_id;

        DROP TABLE workbooks;
    `);
};
