'use strict';

exports.up = (knex: any) =>
    knex.raw(`
    ALTER TABLE entries DROP COLUMN IF EXISTS entry_uuid;
    ALTER TABLE entries DROP COLUMN IF EXISTS saved_uuid;
    ALTER TABLE entries DROP COLUMN IF EXISTS published_uuid;
    ALTER TABLE entries DROP COLUMN IF EXISTS org_id;

    ALTER TABLE revisions DROP COLUMN IF EXISTS rev_uuid;
    ALTER TABLE revisions DROP COLUMN IF EXISTS entry_uuid;

    ALTER TABLE drafts DROP CONSTRAINT IF EXISTS drafts_pkey;
    DROP INDEX IF EXISTS entry_uuid_draft_idx;
    ALTER TABLE drafts DROP COLUMN IF EXISTS entry_uuid;
    ALTER TABLE drafts DROP COLUMN IF EXISTS draft_uuid;

    CREATE UNIQUE INDEX IF NOT EXISTS folder_id_key_idx ON entries (folder_id, key);

    ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_display_key_key;
    ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_key_key;
`);

// Stub for correct rollback
exports.down = (knex: any) => knex.raw('SELECT 1 + 1;');
