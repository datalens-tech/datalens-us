import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(
        `CREATE UNIQUE INDEX CONCURRENTLY user_settings_tenant_id_user_id_idx ON user_settings (tenant_id, user_id);`,
    );
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
    DROP INDEX CONCURRENTLY user_settings_tenant_id_user_id_idx;
 `);
}

export const config = {
    transaction: false,
};
