'use strict';

exports.up = (knex: any) =>
    knex.raw(`
    CREATE TYPE comment_type AS ENUM ('flag-x', 'line-x', 'band-x', 'dot-x-y');

    CREATE TABLE comments (
        id              UUID                        PRIMARY KEY DEFAULT uuid_generate_v1mc(),
        feed            TEXT                        NOT NULL,
        creator_login   TEXT                        NOT NULL,
        created_date    TIMESTAMP(0) WITH TIME ZONE DEFAULT NOW(),
        modifier_login  TEXT                        NULL,
        modified_date   TIMESTAMP(0) WITH TIME ZONE NULL,
        date            TIMESTAMP(0) WITH TIME ZONE NOT NULL,
        date_until      TIMESTAMP(0) WITH TIME ZONE NULL,
        type            COMMENT_TYPE                NOT NULL,
        text            TEXT                        NOT NULL,
        meta            JSONB                       NOT NULL,
        params          JSONB                       NULL,
        is_removed      BOOLEAN                     DEFAULT FALSE,
        removed_date    TIMESTAMP(0) WITH TIME ZONE NULL,
        remover_login   TEXT                        NULL
    );

    ALTER TABLE comments ADD CONSTRAINT modifier_login_with_modified_date
        CHECK (
            (modifier_login IS NULL AND modified_date IS NULL)
            OR (modifier_login IS NOT NULL AND modified_date IS NOT NULL)
        );

    ALTER TABLE comments ADD CONSTRAINT modified_date_after_created_date
        CHECK (modified_date IS NULL OR modified_date > created_date);

    ALTER TABLE comments ADD CONSTRAINT date_until_after_date
        CHECK (date_until IS NULL OR date_until >= date);

    ALTER TABLE comments ADD CONSTRAINT is_removed_with_removed_date_with_remover_login
        CHECK (
            (NOT is_removed AND removed_date IS NULL AND remover_login IS NULL)
            OR (is_removed AND removed_date IS NOT NULL AND remover_login IS NOT NULL)
        );

    CREATE INDEX ON comments (is_removed, feed, date, date_until);
`);

exports.down = (knex: any) =>
    knex.raw(`
    DROP TABLE IF EXISTS comments;
    DROP TYPE IF EXISTS comment_type;
`);
