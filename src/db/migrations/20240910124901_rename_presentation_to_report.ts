import {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TYPE scope RENAME VALUE 'presentation' TO 'report';
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TYPE scope RENAME VALUE 'report' TO 'presentation';
    `);
}
