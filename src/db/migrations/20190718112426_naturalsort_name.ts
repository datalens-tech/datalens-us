import type {Knex} from 'knex';

// http://www.rhodiumtoad.org.uk/junk/naturalsort.sql
exports.up = function (knex: Knex): Promise<any> {
    return knex.raw(`
        CREATE OR REPLACE FUNCTION naturalsort(text) RETURNS bytea AS $$
            SELECT string_agg(
                convert_to(
                    coalesce(
                        r[2],
                        length(length(r[1])::text) || length(r[1])::text || r[1]
                    ),
                    'UTF8'
                ),
                '\\x00'
            ) from regexp_matches(
                regexp_replace(
                    regexp_replace($1, 'ё', 'е', 'g'),
                    '_', '!', 'g'
                ),
                '0*([0-9]+)|([^0-9]+)', 'g'
            ) r;
        $$ LANGUAGE sql IMMUTABLE STRICT;

        ALTER TABLE entries ADD COLUMN sort_name bytea;
        UPDATE entries SET sort_name = naturalsort(name);
        CREATE INDEX sort_name_idx ON entries(sort_name);

        CREATE OR REPLACE FUNCTION update_entries() RETURNS trigger AS $$
        DECLARE
          key TEXT;
        BEGIN
          key := NEW.key;
    
          NEW.tsv := to_tsvector_multilang(key);
          NEW.name := SUBSTRING(key FROM '([^/]*)/\\?$');
          NEW.sort_name := naturalsort(NEW.name);
    
          RETURN NEW;
        END
        $$ LANGUAGE plpgsql;
    `);
};

exports.down = function (knex: Knex): Promise<any> {
    return knex.raw(`
        ALTER TABLE entries DROP COLUMN IF EXISTS sort_name;
        DROP INDEX IF EXISTS sort_name_idx;
    `);
};
