import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(
        `CREATE UNIQUE INDEX CONCURRENTLY user_settings_user_id_tenant_id_idx ON user_settings (user_id, tenant_id);`,
    );
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        DROP INDEX CONCURRENTLY user_settings_user_id_tenant_id_idx;
    `);
}

export const config = {
    transaction: false,
};
