import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE TYPE entity_bindings_target_type AS ENUM ('entries', 'workbooks');

        CREATE TABLE entity_bindings (
            source_id BIGINT NOT NULL REFERENCES entries (entry_id) ON UPDATE CASCADE ON DELETE CASCADE,
            target_id BIGINT NOT NULL,
	        target_type entity_bindings_target_type NOT NULL,
            is_delegated BOOLEAN NOT NULL DEFAULT FALSE,
            created_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_by TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (source_id, target_id)
        );

        CREATE INDEX entity_bindings_source_id_idx ON entity_bindings(source_id);
        CREATE INDEX entity_bindings_target_id_idx ON entity_bindings(target_id);
        CREATE INDEX entity_bindings_target_type_idx ON entity_bindings(target_type);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX entity_bindings_target_type_idx;
        DROP INDEX entity_bindings_target_id_idx;
        DROP INDEX entity_bindings_source_id_idx;

        DROP TABLE entity_bindings;

        DROP TYPE entity_bindings_target_type;
    `);
}
