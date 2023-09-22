import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE TABLE embedding_secrets (
            embedding_secret_id BIGINT DEFAULT get_id() PRIMARY KEY,
            title TEXT NOT NULL,

            workbook_id BIGINT NOT NULL REFERENCES workbooks (workbook_id) ON UPDATE CASCADE ON DELETE CASCADE,

            public_key TEXT NOT NULL,

            created_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX embedding_secrets_workbook_id_idx ON embedding_secrets USING BTREE (workbook_id);

        CREATE TABLE embeds (
            embed_id BIGINT DEFAULT get_id() PRIMARY KEY,
            title TEXT NOT NULL,

            embedding_secret_id BIGINT NOT NULL REFERENCES embedding_secrets (embedding_secret_id) ON UPDATE CASCADE ON DELETE CASCADE,
            entry_id BIGINT NOT NULL REFERENCES entries (entry_id) ON UPDATE CASCADE ON DELETE CASCADE,

            deps_ids TEXT[] NOT NULL DEFAULT '{}',
            unsigned_params TEXT[] NOT NULL DEFAULT '{}',

            created_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX embeds_embedding_secret_id_idx ON embeds USING BTREE (embedding_secret_id);
        CREATE INDEX embeds_entry_id_idx ON embeds USING BTREE (entry_id);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX embeds_entry_id_idx;
        DROP INDEX embeds_embedding_secret_id_idx;

        DROP TABLE embeds;

        DROP INDEX embedding_secrets_workbook_id_idx;

        DROP TABLE embedding_secrets;
    `);
}
