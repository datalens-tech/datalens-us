'use strict';

exports.up = (knex: any) =>
    knex.raw(`
    CREATE SEQUENCE counter_seq;

    CREATE OR REPLACE FUNCTION get_id(OUT result bigint) AS $$
    DECLARE
        our_epoch bigint := 1514754000000;
        seq_id bigint;
        now_millis bigint;
        shard_id int := 1;
    BEGIN
        SELECT nextval('counter_seq') % 4096 INTO seq_id;

        SELECT FLOOR(EXTRACT(EPOCH FROM clock_timestamp()) * 1000) INTO now_millis;
        result := (now_millis - our_epoch) << 23;
        result := result | (shard_id << 10);
        result := result | (seq_id);
    END;
    $$ LANGUAGE PLPGSQL;

    ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_pkey;
    ALTER TABLE entries ADD COLUMN entry_id BIGINT NOT NULL PRIMARY KEY DEFAULT get_id();
    ALTER TABLE entries ADD COLUMN saved_id BIGINT DEFAULT NULL;
    ALTER TABLE entries ADD COLUMN published_id BIGINT DEFAULT NULL;

    ALTER TABLE revisions DROP CONSTRAINT IF EXISTS revisions_pkey;
    ALTER TABLE revisions ALTER COLUMN entry_uuid DROP NOT NULL;
    ALTER TABLE revisions ADD COLUMN rev_id BIGINT NOT NULL PRIMARY KEY DEFAULT get_id();
    ALTER TABLE revisions ADD COLUMN entry_id BIGINT DEFAULT NULL;

    ALTER TABLE drafts DROP CONSTRAINT IF EXISTS drafts_pkey;
    ALTER TABLE drafts ALTER COLUMN entry_uuid DROP NOT NULL;
    ALTER TABLE drafts ADD COLUMN draft_id BIGINT NOT NULL PRIMARY KEY DEFAULT get_id();
    ALTER TABLE drafts ADD COLUMN entry_id BIGINT DEFAULT NULL;

    UPDATE revisions SET entry_id = (SELECT entry_id FROM entries WHERE entries.entry_uuid = revisions.entry_uuid);
    UPDATE entries SET saved_id = (SELECT rev_id FROM revisions WHERE revisions.rev_uuid = entries.saved_uuid);
    UPDATE entries SET published_id = (SELECT rev_id FROM revisions WHERE revisions.rev_uuid = entries.published_uuid);
`);

exports.down = (knex: any) => {
    return knex.raw(`
        DROP SEQUENCE IF EXISTS counter_seq;
    `);
};
