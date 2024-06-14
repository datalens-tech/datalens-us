// const path = require('path');

const DSNParser = require('dsn-parser');
const knexBuilder = require('knex');
const _ = require('lodash');

const {getKnexOptions: getKnexUsOptions} = require('../../dist/server/db/init-db');
const {getTestDsnList} = require('../../dist/server/tests/int/db');

const prepareTestUsDb = async ({dsnList}) => {
    const knexOptions = _.merge({}, getKnexUsOptions(), {
        connection: dsnList,
        // seeds: {
        //     directory: path.resolve(__dirname, '../../dist/server/tests/int/seeds'),
        // },
    });

    const knexInstance = knexBuilder(knexOptions);

    await knexInstance.raw(`
        CREATE EXTENSION IF NOT EXISTS pg_trgm;
        CREATE EXTENSION IF NOT EXISTS btree_gin;
        CREATE EXTENSION IF NOT EXISTS btree_gist;
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);

    await knexInstance.migrate.rollback(undefined, true);
    await knexInstance.migrate.latest();
    // await knexInstance.seed.run();
    await knexInstance.destroy();
};

const prepareTestDb = async () => {
    const dsnList = getTestDsnList();

    const testDbName = 'test_us_ci_purgeable';
    const parsedDsn = new DSNParser(dsnList);
    if (parsedDsn.getParts().database !== testDbName) {
        throw new Error(`Database for tests should be named \`${testDbName}\`!`);
    }

    await prepareTestUsDb({dsnList});
};

module.exports = {prepareTestDb};
