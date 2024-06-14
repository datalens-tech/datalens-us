// Each Pino instance (created in CoreApp instances) attaches multiple event handlers.
// EventEmitter warns that this is possibly a bug and reports it to the stderr, so in the
// test environment the max listeners limitation is lifted.
require('events').EventEmitter.defaultMaxListeners = 1000;

require('../../dist/server');

const {db} = require('../../dist/server/db');

const {prepareTestDb} = require('./prepare-test-db');

global.beforeAll(async () => {
    await db.ready();

    await prepareTestDb();
});

global.afterAll(async () => {
    await db.terminate();
});
