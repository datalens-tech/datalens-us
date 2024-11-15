import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP TABLE migrations_tenants;
    `);
}

export async function down(): Promise<void> {
    return Promise.resolve();
}
