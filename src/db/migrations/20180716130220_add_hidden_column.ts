'use strict';

exports.up = (knex: any) =>
    knex.raw(`
    ALTER TABLE entries ADD COLUMN hidden BOOLEAN DEFAULT false;
`);

exports.down = (knex: any) => knex.raw('');
