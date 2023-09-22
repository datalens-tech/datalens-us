'use strict';

exports.up = (knex: any) =>
    knex.raw(`
    CREATE TABLE locks (
        lock_id BIGINT PRIMARY KEY DEFAULT get_id(),
        entry_id BIGINT NOT NULL,
        lock_token TEXT NOT NULL,
        expiry_date TIMESTAMP NOT NULL,
        login TEXT DEFAULT NULL
    );
`);

exports.down = (knex: any) => {
    return knex.schema.dropTableIfExists('locks');
};
