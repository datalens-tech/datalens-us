const path = require('path');

const DSNParser = require('dsn-parser');
const knexBuilder = require('knex');
const _ = require('lodash');

const {getKnexOptions} = require('../../dist/server/db/init-db');
const {getTestDsnList} = require('../../dist/server/tests/int/db');
const {truncateTables, tableExists} = require('../../dist/server/tests/int/utils');

const prepareTestUsDb = async ({dsnList}) => {
    const knexOptions = _.merge({}, getKnexOptions(), {
        connection: dsnList,
        seeds: {
            directory: path.resolve(__dirname, '../../dist/server/tests/int/seeds'),
        },
    });

    const knexInstance = knexBuilder(knexOptions);

    const exists = await tableExists(knexInstance);

    if (exists) {
        await truncateTables(knexInstance);
    } else {
        await knexInstance.raw(`
            CREATE EXTENSION IF NOT EXISTS pg_trgm;
            CREATE EXTENSION IF NOT EXISTS btree_gin;
            CREATE EXTENSION IF NOT EXISTS btree_gist;
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        `);
        await knexInstance.migrate.latest();
    }

    await knexInstance.seed.run();

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
