import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`DROP INDEX CONCURRENTLY name_idx;`);
    await knex.raw(`DROP INDEX CONCURRENTLY sort_name_idx;`);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`CREATE INDEX CONCURRENTLY sort_name_idx ON entries(sort_name);`);
    await knex.raw(`CREATE INDEX CONCURRENTLY name_idx ON entries(name);`);
}

export const config = {
    transaction: false,
};
