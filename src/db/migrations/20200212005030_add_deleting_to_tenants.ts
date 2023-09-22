import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        ALTER TABLE tenants
            ADD COLUMN deleting BOOLEAN NOT NULL DEFAULT FALSE;
    `);
};

exports.down = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        ALTER TABLE tenants
            DROP COLUMN deleting;
    `);
};
