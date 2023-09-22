import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<any> {
    return knex.raw(`
        CREATE TABLE links (
            from_id  BIGINT NOT NULL,
            to_id BIGINT null,
            name text NOT null,
            PRIMARY KEY (from_id, to_id)
        );
        
        ALTER TABLE revisions ADD COLUMN links JSONB;
        
        CREATE INDEX from_id_idx ON links(from_id);
        CREATE INDEX to_id_idx ON links(to_id);
    `);
};

exports.down = function (knex: Knex): Promise<any> {
    return knex.raw(`
        DROP TABLE IF EXISTS links;
        ALTER TABLE revisions DROP COLUMN IF EXISTS links;
        DROP INDEX IF EXISTS from_id_idx;
        DROP INDEX IF EXISTS to_id_idx;
    `);
};
