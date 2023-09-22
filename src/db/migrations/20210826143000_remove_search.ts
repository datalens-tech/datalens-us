import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        DROP INDEX tsv_idx;
        ALTER TABLE entries DROP COLUMN tsv;

        CREATE OR REPLACE FUNCTION update_entries() RETURNS trigger AS $$
        DECLARE
          key TEXT;
        BEGIN
          key := NEW.key;

          NEW.name := SUBSTRING(key FROM '([^/]*)/\\?$');
          NEW.sort_name := naturalsort(NEW.name);

          RETURN NEW;
        END
        $$ LANGUAGE plpgsql;

        DROP FUNCTION to_tsvector_multilang;
        DROP FUNCTION correct_search_string;
    `);
};

exports.down = function (knex: Knex): Promise<unknown> {
    // From 20190218115628_full_text_search
    return knex.raw(`
        ALTER TABLE entries ADD COLUMN tsv tsvector;
        CREATE INDEX tsv_idx ON entries USING gin(tsv);

        CREATE OR REPLACE FUNCTION correct_search_string(str Text) RETURNS TEXT AS $$
        DECLARE
        matchingCharacters CONSTANT TEXT := '/_.';
        replaceCharacters CONSTANT TEXT := '   ';
        BEGIN
        return translate(coalesce(str, ''), matchingCharacters, replaceCharacters);
        END
        $$ LANGUAGE 'plpgsql' IMMUTABLE;

        CREATE OR REPLACE FUNCTION to_tsvector_multilang(key TEXT) RETURNS tsvector AS $$
        DECLARE
        keyNext TEXT;
        BEGIN
        keyNext = correct_search_string(key);

        RETURN (
            setweight(to_tsvector('russian', keyNext),'A') ||
            setweight(to_tsvector('english', keyNext),'A')
        );
        END
        $$ LANGUAGE 'plpgsql' IMMUTABLE;

        UPDATE entries SET tsv = to_tsvector_multilang(key);

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
    `);
};
