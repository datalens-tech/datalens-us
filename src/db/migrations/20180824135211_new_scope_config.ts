'use strict';

exports.up = (knex: any) =>
    knex.raw(`
    ALTER TYPE scope ADD VALUE 'config';
`);

exports.down = (knex: any) => knex.raw('');

exports.config = {
    transaction: false,
};
