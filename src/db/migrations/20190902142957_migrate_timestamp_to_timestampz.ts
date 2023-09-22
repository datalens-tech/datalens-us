import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<any> {
    return knex.raw(`
        ALTER TABLE entries ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
        ALTER TABLE entries ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
        ALTER TABLE entries ALTER COLUMN deleted_at TYPE TIMESTAMPTZ USING deleted_at AT TIME ZONE 'UTC';
        ALTER TABLE revisions ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
        ALTER TABLE revisions ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
        ALTER TABLE states ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
        ALTER TABLE locks ALTER COLUMN expiry_date TYPE TIMESTAMPTZ USING expiry_date AT TIME ZONE 'UTC';
        ALTER TABLE favorites ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
        ALTER TABLE tenants ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
    `);
};

exports.down = function (knex: Knex): Promise<any> {
    return knex.raw(`
        ALTER TABLE entries ALTER COLUMN created_at TYPE TIMESTAMP;
        ALTER TABLE entries ALTER COLUMN updated_at TYPE TIMESTAMP;
        ALTER TABLE entries ALTER COLUMN deleted_at TYPE TIMESTAMP;
        ALTER TABLE revisions ALTER COLUMN created_at TYPE TIMESTAMP;
        ALTER TABLE revisions ALTER COLUMN updated_at TYPE TIMESTAMP;
        ALTER TABLE states ALTER COLUMN created_at TYPE TIMESTAMP;
        ALTER TABLE locks ALTER COLUMN expiry_date TYPE TIMESTAMP;
        ALTER TABLE favorites ALTER COLUMN created_at TYPE TIMESTAMP;
        ALTER TABLE tenants ALTER COLUMN created_at TYPE TIMESTAMP;
    `);
};
