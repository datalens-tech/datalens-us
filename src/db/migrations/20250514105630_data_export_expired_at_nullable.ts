import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw('ALTER TABLE data_exports ALTER COLUMN expired_at DROP NOT NULL');
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw('ALTER TABLE data_exports ALTER COLUMN expired_at SET NOT NULL');
}
