const DSNParser = require('dsn-parser');
const knexBuilder = require('knex');
const _ = require('lodash');

const {getKnexOptions} = require('../../dist/server/db/init-db');
const {getTestDsnList} = require('../../dist/server/tests/int/db');

const tableExists = async (knex, table) => {
    const nodesExistsResult = await knex.raw(
        `
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = ?
            );
        `,
        [table],
    );

    return nodesExistsResult.rows[0].exists;
};

async function truncateTables(knex) {
    const tables = await knex
        .select('table_name')
        .from('information_schema.tables')
        .where({
            table_schema: 'public',
            table_type: 'BASE TABLE',
        })
        .whereNotIn('table_name', ['migrations', 'migrations_lock', 'tenants']);

    for (const table of tables) {
        await knex.raw(`TRUNCATE TABLE "${table.tableName}" RESTART IDENTITY CASCADE`);
    }
}

const prepareTestUsDb = async ({dsnList}) => {
    const knexOptions = _.merge({}, getKnexOptions(), {
        connection: dsnList,
    });

    const knexInstance = knexBuilder(knexOptions);

    const exists = await tableExists(knexInstance, 'entries');

    if (exists) {
        await truncateTables(knexInstance);
    } else {
        await knexInstance.raw(`
            CREATE SCHEMA IF NOT EXISTS public;
            CREATE EXTENSION IF NOT EXISTS pg_trgm;
            CREATE EXTENSION IF NOT EXISTS btree_gin;
            CREATE EXTENSION IF NOT EXISTS btree_gist;
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        `);
        await knexInstance.migrate.latest();
    }

    await knexInstance.destroy();
};

const prepareTestDb = async () => {
    const dsnList = getTestDsnList();

    const testDbName = 'int-testing_us_ci_purgeable';
    const parsedDsn = new DSNParser(dsnList);
    if (parsedDsn.getParts().database !== testDbName) {
        throw new Error(`Database for tests should be named \`${testDbName}\`!`);
    }

    await prepareTestUsDb({dsnList});
};

module.exports = {prepareTestDb};
