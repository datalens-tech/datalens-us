const {TestcontainersEnvironment} = require('@trendyol/jest-testcontainers');
const knexBuilder = require('knex');

const {getKnexOptions} = require('../../dist/server/db/init-db');
const {getTestDsnList} = require('../../dist/server/tests/int/db');

class TestEnvironment extends TestcontainersEnvironment {
    static prepearedDbPromise;

    static prepareDb = ({host, port}) => {
        if (TestEnvironment.prepearedDbPromise) {
            return TestEnvironment.prepearedDbPromise;
        }

        const getPreparedDbPromise = async () => {
            const dsnList = getTestDsnList({host, port});

            const testDbName = 'test_us_ci_purgeable';
            if (!dsnList.endsWith(`/${testDbName}`)) {
                throw new Error(`Database for tests should be named \`${testDbName}\`!`);
            }

            const knexInstance = knexBuilder({
                ...getKnexOptions(),
                connection: dsnList,
            });

            const tenantsExistsResult = await knexInstance.raw(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = 'tenants'
                );
            `);

            if (tenantsExistsResult.rows[0].exists === true) {
                throw new Error(
                    "Database is not empty, `tenants` table already exists. Don't run tests on databases with data!",
                );
            }

            await knexInstance.raw(`
                CREATE EXTENSION IF NOT EXISTS pg_trgm;
                CREATE EXTENSION IF NOT EXISTS btree_gin;
                CREATE EXTENSION IF NOT EXISTS btree_gist;
                CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            `);

            await knexInstance.migrate.latest();
            await knexInstance.seed.run();

            await knexInstance.destroy();
        };

        TestEnvironment.prepearedDbPromise = getPreparedDbPromise();
        return TestEnvironment.prepearedDbPromise;
    };

    async setup() {
        await super.setup();

        await TestEnvironment.prepareDb({
            host: this.global.__TESTCONTAINERS_POSTGRE_IP__,
            port: this.global.__TESTCONTAINERS_POSTGRE_PORT_5432__,
        });
    }

    async teardown() {
        await super.teardown();
    }
}

module.exports = TestEnvironment;
