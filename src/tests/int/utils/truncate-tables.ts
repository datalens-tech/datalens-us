import type {Knex} from 'knex';

type TruncateTableArg = {
    exclude: string[];
};

export async function truncateTables(
    knex: Knex,
    {exclude}: TruncateTableArg = {exclude: ['migrations', 'migrations_lock']},
) {
    const tables = await knex
        .select('table_name')
        .from('information_schema.tables')
        .where({
            table_schema: 'public',
            table_type: 'BASE TABLE',
        })
        .whereNotIn('table_name', exclude);

    for (const table of tables) {
        await knex.raw(`TRUNCATE TABLE "${table.tableName}" RESTART IDENTITY CASCADE`);
    }
}
