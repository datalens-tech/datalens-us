const {TestcontainersEnvironment} = require('@blueground/jest-testcontainers');

class TestEnvironment extends TestcontainersEnvironment {
    async setup() {
        await super.setup();
    }

    async teardown() {
        await super.teardown();
    }
}

module.exports = TestEnvironment;
