'use strict';

exports.up = (knex: any) =>
    knex.raw(`
    ALTER TABLE entries ADD COLUMN display_key TEXT UNIQUE;
    UPDATE entries SET display_key = key;
    UPDATE entries SET key = lower(display_key);
`);

exports.down = (knex: any) => knex.raw('');
