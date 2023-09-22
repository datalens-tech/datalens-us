import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<any> {
    return knex.raw(`
        ALTER TABLE entries ADD COLUMN name TEXT;
        UPDATE entries SET name = SUBSTRING(key FROM '([^/]*)/\\?$');
        CREATE INDEX name_idx ON entries(name);

        DROP TRIGGER IF EXISTS before_entries_insert_or_update on entries;
        DROP FUNCTION IF EXISTS update_tsv();

        CREATE OR REPLACE FUNCTION update_entries() RETURNS trigger AS $$
        DECLARE
          key TEXT;
        BEGIN
          key := NEW.key;
    
          NEW.tsv := to_tsvector_multilang(key);
          NEW.name := SUBSTRING(key FROM '([^/]*)/\\?$');
    
          RETURN NEW;
        END
        $$ LANGUAGE plpgsql;
    
        CREATE TRIGGER before_entries_insert_or_update BEFORE INSERT OR UPDATE ON entries
          FOR EACH ROW EXECUTE PROCEDURE update_entries();
    `);
};

exports.down = function (knex: Knex): Promise<any> {
    return knex.raw(`
        ALTER TABLE entries DROP COLUMN IF EXISTS name;
        DROP INDEX IF EXISTS name_idx;
    `);
};
