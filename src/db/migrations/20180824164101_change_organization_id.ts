'use strict';

exports.up = (knex: any) =>
    knex.raw(`
    ALTER TABLE entries ADD COLUMN folder_id TEXT DEFAULT NULL;

    UPDATE entries SET folder_id = 'common';
`);

// Stub for correct rollback
exports.down = (knex: any) => knex.raw('SELECT 1 + 1;');
