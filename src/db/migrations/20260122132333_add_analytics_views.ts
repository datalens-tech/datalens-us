import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        CREATE VIEW tenants_analytics_view AS
        SELECT
            tenant_id,
            created_at,
            billing_instance_service_id,
            billing_instance_service_is_active,
            billing_instance_service_updated_at,
            trial_ended_at,
            trial_without_billing,
            billing_discount,
            settings
        FROM tenants;

        CREATE VIEW license_limits_analytics_view AS
        SELECT
            encode_id(license_limit_id) as license_limit_id,
            tenant_id,
            type,
            started_at,
            creators_limit_value
        FROM license_limits;

        CREATE VIEW licenses_analytics_view AS
        SELECT 
            encode_id(license_id) as license_id,
            tenant_id,
            user_id,
            expires_at,
            created_by,
            created_at
        FROM licenses;
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        DROP VIEW licenses_analytics_view;
        DROP VIEW license_limits_analytics_view;
        DROP VIEW tenants_analytics_view;
    `);
}
