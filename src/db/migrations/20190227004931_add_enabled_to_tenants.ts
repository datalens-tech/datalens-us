import type {Knex} from 'knex';

exports.up = (knex: Knex) =>
    knex.raw(`
    ALTER TABLE tenants ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT false;
`);

exports.down = (knex: Knex) =>
    knex.raw(`
    ALTER TABLE IF EXISTS tenants DROP COLUMN enabled;
`);
