import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE TABLE collections (
            collection_id BIGINT DEFAULT get_id() PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT DEFAULT NULL,
            parent_id BIGINT DEFAULT NULL REFERENCES collections (collection_id) ON UPDATE CASCADE ON DELETE CASCADE,

            tenant_id TEXT NOT NULL DEFAULT 'common' REFERENCES tenants (tenant_id) ON UPDATE CASCADE ON DELETE CASCADE,
            project_id TEXT DEFAULT NULL,

            created_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            updated_by TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            deleted_by TEXT DEFAULT NULL,
            deleted_at TIMESTAMPTZ DEFAULT NULL,

            meta JSONB NOT NULL DEFAULT '{}'::jsonb
        );

        ALTER TABLE workbooks ADD COLUMN collection_id BIGINT DEFAULT NULL REFERENCES collections (collection_id) ON UPDATE CASCADE ON DELETE CASCADE;
        ALTER TABLE workbooks ADD COLUMN deleted_by TEXT DEFAULT NULL;

        CREATE INDEX collections_tenant_id_idx ON collections USING BTREE (tenant_id);
        CREATE INDEX collections_project_id_idx ON collections USING BTREE (project_id);
        CREATE INDEX collections_parent_id_idx ON collections USING BTREE (parent_id);
        CREATE INDEX workbooks_collection_id_idx ON workbooks USING BTREE (collection_id);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX workbooks_collection_id_idx;
        DROP INDEX collections_parent_id_idx;
        DROP INDEX collections_project_id_idx;
        DROP INDEX collections_tenant_id_idx;

        ALTER TABLE workbooks DROP COLUMN deleted_by;
        ALTER TABLE workbooks DROP COLUMN collection_id;

        DROP TABLE collections;
    `);
}
