import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        CREATE TABLE user_settings (
            user_id TEXT PRIMARY KEY,
            settings JSONB NOT NULL DEFAULT '{}'::jsonb,
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);
};

exports.down = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        DROP TABLE user_settings;
    `);
};
