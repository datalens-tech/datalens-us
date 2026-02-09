const fs = require('fs');
const path = require('path');

const JestEnvironmentNode = require('jest-environment-node');

const CONTAINERS_METADATA_PATH = path.join(__dirname, 'containers-metadata.json');

class TestEnvironment extends JestEnvironmentNode.default {
    async setup() {
        const workerId = process.env.JEST_WORKER_ID || '1';

        if (!fs.existsSync(CONTAINERS_METADATA_PATH)) {
            throw new Error(
                `[Worker ${workerId}] Containers metadata file not found. Global setup may not have run.`,
            );
        }

        const containersMetadata = JSON.parse(fs.readFileSync(CONTAINERS_METADATA_PATH, 'utf-8'));
        const workerMetadata = containersMetadata[workerId];

        if (!workerMetadata) {
            throw new Error(
                `[Worker ${workerId}] No container metadata found for worker ${workerId}. Available workers: ${Object.keys(containersMetadata).join(', ')}`,
            );
        }

        const {ip, name, portMappings} = workerMetadata;
        this.global.__TESTCONTAINERS_POSTGRE_IP__ = ip;
        this.global.__TESTCONTAINERS_POSTGRE_NAME__ = name;

        const portMappingsMap = new Map(Object.entries(portMappings));
        for (const [originalPort, boundPort] of portMappingsMap.entries()) {
            this.global[`__TESTCONTAINERS_POSTGRE_PORT_${originalPort}__`] = parseInt(
                boundPort,
                10,
            );
        }

        await super.setup();
    }

    async teardown() {
        await super.teardown();
    }
}

module.exports = TestEnvironment;
