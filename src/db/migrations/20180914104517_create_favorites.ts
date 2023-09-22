'use strict';

exports.up = (knex: any) =>
    knex.raw(`
    CREATE TABLE favorites (
        entry_id BIGINT NOT NULL,
        tenant_id TEXT NOT NULL,
        login TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (entry_id, login)
    );

    CREATE INDEX tenant_id_plus_login_idx
        ON favorites USING btree(tenant_id, login);
`);

exports.down = (knex: any) => {
    return knex.schema.dropTableIfExists('favorites');
};
