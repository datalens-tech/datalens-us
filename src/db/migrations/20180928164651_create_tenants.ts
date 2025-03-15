'use strict';

exports.up = (knex: any) =>
    knex.raw(`
    CREATE TABLE tenants
    (
        tenant_id TEXT PRIMARY KEY NOT NULL,
        meta jsonb DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE UNIQUE INDEX tenants_tenant_id_uindex ON tenants (tenant_id)
`);

exports.down = (knex: any) => {
    return knex.schema.dropTableIfExists('tenants');
};
