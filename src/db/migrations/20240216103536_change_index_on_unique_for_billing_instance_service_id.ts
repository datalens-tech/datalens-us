import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX tenants_billing_instance_service_id_idx;

        CREATE UNIQUE INDEX
            tenants_billing_instance_service_id_idx
        ON tenants USING
            BTREE (billing_instance_service_id);      
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX tenants_billing_instance_service_id_idx;
        
        CREATE INDEX 
            tenants_billing_instance_service_id_idx
        ON tenants USING
            BTREE (billing_instance_service_id);
    `);
}
