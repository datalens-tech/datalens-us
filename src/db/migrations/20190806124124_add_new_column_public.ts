import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<any> {
    return knex.raw(`
        ALTER TABLE entries ADD COLUMN public BOOLEAN DEFAULT false;
        CREATE INDEX public_idx ON entries(public);
    `);
};

exports.down = function (knex: Knex): Promise<any> {
    return knex.raw(`
        ALTER TABLE entries DROP COLUMN IF EXISTS public;
        DROP INDEX IF EXISTS public_idx;
    `);
};
