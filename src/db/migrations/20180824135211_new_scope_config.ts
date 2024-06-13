'use strict';

exports.up = (knex: any) =>
    knex.raw(`
    ALTER TYPE scope ADD VALUE 'config';
`);

// Stub for correct rollback
exports.down = (knex: any) => knex.raw('SELECT 1 + 1;');

exports.config = {
    transaction: false,
};
