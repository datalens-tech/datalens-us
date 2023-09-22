import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<any> {
    return knex.raw(`
        ALTER TABLE links DROP CONSTRAINT links_pkey;
        ALTER TABLE links ADD CONSTRAINT links_pkey PRIMARY KEY (from_id, to_id, name);
    `);
};

exports.down = function (knex: Knex): Promise<any> {
    return knex.raw(`
        ALTER TABLE links DROP CONSTRAINT links_pkey;
    `);
};
