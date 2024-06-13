'use strict';

exports.up = (knex: any) =>
    knex.raw(`
    ALTER TABLE entries RENAME COLUMN folder_id TO tenant_id;
    ALTER INDEX folder_id_key_idx RENAME TO tenant_id_key_idx;
`);

// Stub for correct rollback
exports.down = (knex: any) => knex.raw('SELECT 1 + 1;');
