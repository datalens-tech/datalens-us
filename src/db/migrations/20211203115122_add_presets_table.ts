import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        CREATE TABLE presets (
            preset_id BIGINT DEFAULT get_id() PRIMARY KEY,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            data JSONB NOT NULL DEFAULT '{}'::jsonb
        );
    `);
};

exports.down = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        DROP TABLE presets;
    `);
};
