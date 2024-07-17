import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TYPE scope ADD VALUE 'presentation';
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw('');
}

export const config = {
    transaction: false,
};
