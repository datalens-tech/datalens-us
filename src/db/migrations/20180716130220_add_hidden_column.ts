'use strict';

exports.up = (knex: any) =>
    knex.raw(`
    ALTER TABLE entries ADD COLUMN hidden BOOLEAN DEFAULT false;
`);

// Stub for correct rollback
exports.down = (knex: any) => knex.raw('SELECT 1 + 1;');
