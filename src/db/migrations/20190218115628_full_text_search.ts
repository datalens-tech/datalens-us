'use strict';

exports.up = (knex: any) =>
    knex.raw(`
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


    CREATE OR REPLACE FUNCTION update_tsv() RETURNS trigger AS $$
    DECLARE
      key TEXT;
    BEGIN
      key := new.key;

      new.tsv := to_tsvector_multilang(key);

      RETURN new;
    END
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER before_entries_insert_or_update BEFORE INSERT OR UPDATE ON entries
      FOR EACH ROW EXECUTE PROCEDURE update_tsv();
`);

exports.down = (knex: any) => {
    return knex.schema.table('entries', async (entries: any) => {
        const hasColumnTsv = entries.schema && entries.schema.hasColumn('tsv');

        if (hasColumnTsv) {
            entries.dropColumn('tsv');
        }
    });
};
