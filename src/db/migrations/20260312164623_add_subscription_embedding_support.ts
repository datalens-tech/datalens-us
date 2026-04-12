import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE TYPE embed_type_enum AS ENUM ('subscription');

        ALTER TABLE embedding_secrets
            ADD COLUMN type embed_type_enum DEFAULT NULL;

        DROP INDEX embedding_secrets_workbook_id_idx;
        CREATE INDEX embedding_secrets_workbook_id_type_idx
            ON embedding_secrets USING BTREE (workbook_id, type);

        ALTER TABLE embeds
            ADD COLUMN type embed_type_enum DEFAULT NULL,
            ADD COLUMN allow_all_deps BOOLEAN NOT NULL DEFAULT FALSE;

        DROP INDEX embeds_entry_id_idx;
        CREATE INDEX embeds_entry_id_type_idx
            ON embeds USING BTREE (entry_id, type);

        ALTER TABLE subscriptions
            ADD COLUMN embed_id BIGINT REFERENCES embeds (embed_id) ON DELETE SET NULL,
            ADD COLUMN embed_private_key jsonb DEFAULT '{}'::jsonb;

        CREATE INDEX subscriptions_embed_id_idx
            ON subscriptions(embed_id)
            WHERE embed_id IS NOT NULL;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX subscriptions_embed_id_idx;
        
        ALTER TABLE subscriptions
            DROP COLUMN embed_private_key,
            DROP COLUMN embed_id;

        DROP INDEX embeds_entry_id_type_idx;
        CREATE INDEX embeds_entry_id_idx ON embeds USING BTREE (entry_id);
        
        ALTER TABLE embeds 
            DROP COLUMN allow_all_deps,
            DROP COLUMN type;

        DROP INDEX embedding_secrets_workbook_id_type_idx;
        CREATE INDEX embedding_secrets_workbook_id_idx ON embedding_secrets USING BTREE (workbook_id);
        
        ALTER TABLE embedding_secrets DROP COLUMN type;

        DROP TYPE embed_type_enum;
    `);
}
