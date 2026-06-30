import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        DROP VIEW tenants_analytics_view;

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
            settings,
            meta
        FROM tenants;
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        DROP VIEW tenants_analytics_view;

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
    `);
}
