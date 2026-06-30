import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        CREATE VIEW license_quarantines_analytics_view AS
        SELECT
            encode_id(license_quarantine_id) as license_quarantine_id,
            tenant_id,
            license_type,
            started_at,
            ends_at,
            meta
        FROM license_quarantines;
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        DROP VIEW license_quarantines_analytics_view;
    `);
}
