import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`ALTER TYPE scope ADD VALUE 'compute';`);
}

// PostgreSQL does not support removing a value from an enum type, so the down migration is a no-op.
export async function down(knex: Knex): Promise<void> {
    await knex.raw('');
}

// ALTER TYPE ... ADD VALUE cannot run inside a transaction block.
export const config = {
    transaction: false,
};
