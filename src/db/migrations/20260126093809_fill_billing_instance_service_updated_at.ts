import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        UPDATE tenants 
        SET billing_instance_service_updated_at = NOW() 
        WHERE trial_without_billing = FALSE OR (
            trial_without_billing IS NULL AND
            billing_instance_service_is_active = TRUE
        );
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        UPDATE tenants 
        SET billing_instance_service_updated_at = NULL 
        WHERE billing_instance_service_updated_at IS NOT NULL;
    `);
}
