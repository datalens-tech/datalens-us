import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        CREATE VIEW analytics_tables_row_count_view AS
        SELECT
            'tenants_analytics_view' AS view_name,
            COUNT(*) AS row_count
        FROM tenants
        UNION ALL
        SELECT
            'license_limits_analytics_view' AS view_name,
            COUNT(*) AS row_count
        FROM license_limits
        UNION ALL
        SELECT
            'licenses_analytics_view' AS view_name,
            COUNT(*) AS row_count
        FROM licenses;
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        DROP VIEW analytics_tables_row_count_view;
    `);
}
