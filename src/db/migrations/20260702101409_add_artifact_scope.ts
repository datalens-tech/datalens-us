import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`ALTER TYPE scope ADD VALUE 'artifact';`);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw('');
}

export const config = {
    transaction: false,
};
