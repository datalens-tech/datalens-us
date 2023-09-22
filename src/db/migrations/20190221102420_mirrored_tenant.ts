'use strict';

exports.up = (knex: any) =>
    knex.raw(`
    ALTER TABLE entries ADD COLUMN mirrored BOOLEAN DEFAULT false;
`);

exports.down = (knex: any) =>
    knex.raw(`
    ALTER TABLE IF EXISTS entries DROP COLUMN mirrored;
`);
