const path = require('path');

const knexBuilder = require('knex');
const _ = require('lodash');

const {getKnexOptions} = require('../../dist/server/db/init-db');
const {assertDbName, getTestDsnList, testDbConfig} = require('../../dist/server/tests/int/db');
const {truncateTables, tableExists} = require('../../dist/server/tests/int/utils');

const prepareTestMainDb = async ({dsnList}) => {
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
    assertDbName(dsnList, testDbConfig.dbName);

    await prepareTestMainDb({dsnList});
};

module.exports = {prepareTestDb};
