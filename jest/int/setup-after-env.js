// Each Pino instance (created in CoreApp instances) attaches multiple event handlers.
// EventEmitter warns that this is possibly a bug and reports it to the stderr, so in the
// test environment the max listeners limitation is lifted.
require('events').EventEmitter.defaultMaxListeners = 1000;

require('../../dist/server/tests/int/mocks');
require('../../dist/server');

const {registry} = require('../../dist/server/registry');

const {prepareTestDb} = require('./prepare-test-db');

global.beforeAll(async () => {
    const {db} = registry.getDbInstance();
    await db.ready();

    await prepareTestDb();
});

global.afterAll(async () => {
    const {db} = registry.getDbInstance();
    await db.terminate();
});
