'use strict';

exports.up = (knex: any) =>
    knex.raw(`
    -- CREATE EXTENSION IF NOT EXISTS pg_trgm;
    -- CREATE EXTENSION IF NOT EXISTS btree_gin;
    -- CREATE EXTENSION IF NOT EXISTS btree_gist;
    -- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TYPE SCOPE AS ENUM ('dataset', 'pdf', 'folder');

    CREATE TABLE entries (
      entry_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v1mc(),
      org_id UUID,

      scope SCOPE,
      type TEXT NOT NULL,
      key TEXT UNIQUE,
      inner_meta JSONB,

      created_by TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_by TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW(),

      saved_uuid UUID DEFAULT NULL,
      published_uuid UUID DEFAULT NULL,

      is_deleted BOOLEAN DEFAULT false,
      deleted_at TIMESTAMP DEFAULT NULL
    );

    CREATE INDEX key_idx
        ON entries USING GIN(key gin_trgm_ops);
    CREATE INDEX org_id_idx
        ON entries USING btree(org_id);
    CREATE INDEX key_plus_org_id_idx
        ON entries USING btree(key, org_id);

    CREATE TABLE revisions (
      rev_uuid UUID UNIQUE PRIMARY KEY DEFAULT uuid_generate_v1mc(),
      entry_uuid UUID NOT NULL,

      data JSONB,
      meta JSONB,

      created_by TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_by TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX entry_uuid_rev_idx
        ON revisions USING btree(entry_uuid);

    CREATE TABLE drafts (
      draft_uuid UUID UNIQUE PRIMARY KEY DEFAULT uuid_generate_v1mc(),
      entry_uuid UUID NOT NULL DEFAULT uuid_generate_v1mc(),

      data JSONB,
      meta JSONB,

      created_by TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX entry_uuid_draft_idx
        ON drafts USING btree(entry_uuid);
`);

exports.down = (knex: any) => {
    return knex.raw(`
        DROP TABLE IF EXISTS entries;
        DROP TABLE IF EXISTS revisions;
        DROP TABLE IF EXISTS drafts;
        DROP TYPE IF EXISTS scope;
    `);
};
