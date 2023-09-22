'use strict';

exports.up = (knex: any) =>
    knex.raw(`
    CREATE TABLE states (
        hash TEXT NOT NULL,
        entry_id BIGINT NOT NULL,
        data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (hash, entry_id)
    );
`);

exports.down = (knex: any) => {
    return knex.schema.dropTableIfExists('states');
};
