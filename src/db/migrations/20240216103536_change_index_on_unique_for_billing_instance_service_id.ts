import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE UNIQUE INDEX CONCURRENTLY
            tenants_new_billing_instance_service_id_idx
        ON tenants USING
            BTREE (billing_instance_service_id);
  
        DROP INDEX CONCURRENTLY tenants_billing_instance_service_id_idx;
  
        ALTER INDEX
            tenants_new_billing_instance_service_id_idx
        RENAME TO
            tenants_billing_instance_service_id_idx;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE INDEX CONCURRENTLY
            tenants_new_billing_instance_service_id_idx
        ON tenants USING
            BTREE (billing_instance_service_id);
  
        DROP INDEX CONCURRENTLY tenants_billing_instance_service_id_idx;
  
        ALTER INDEX
            tenants_new_billing_instance_service_id_idx
        RENAME TO
            tenants_billing_instance_service_id_idx;
    `);
}
