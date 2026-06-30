import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        CREATE UNIQUE INDEX CONCURRENTLY favorites_entity_id_login_uniq_idx
            ON favorites (entity_id, login);
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`DROP INDEX CONCURRENTLY favorites_entity_id_login_uniq_idx;`);
}

export const config = {
    transaction: false,
};
