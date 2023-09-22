'use strict';

exports.up = (knex: any) =>
    knex.raw(`
    ALTER TABLE entries ADD COLUMN folder_id TEXT DEFAULT NULL;

    UPDATE entries SET folder_id = 'common';
`);

exports.down = (knex: any) => knex.raw('');
