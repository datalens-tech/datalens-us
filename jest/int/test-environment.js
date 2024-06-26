const {TestcontainersEnvironment} = require('@trendyol/jest-testcontainers');

class TestEnvironment extends TestcontainersEnvironment {
    async setup() {
        await super.setup();
    }

    async teardown() {
        await super.teardown();
    }
}

module.exports = TestEnvironment;
