const fs = require('fs');
const path = require('path');

const {startContainer} = require('@blueground/jest-testcontainers/dist/containers');

const {calculateWorkerCount} = require('./helpers');

const apiPath = path.resolve(process.cwd(), 'dist/server/opensource/api/tests/db');
const dbPath = fs.existsSync(apiPath + '.js')
    ? apiPath
    : path.resolve(__dirname, '../../dist/server/tests/int/db');

const {testDbConfig} = require(dbPath);

// Path to store container metadata (accessible to all workers)
const CONTAINERS_METADATA_PATH = path.join(__dirname, 'containers-metadata.json');

module.exports = async () => {
    // Read maxWorkers from environment variable or default to '50%'
    const maxWorkersValue = process.env.JEST_MAX_WORKERS || '50%';

    // Calculate actual worker count (needed for container creation)
    const maxWorkers = calculateWorkerCount(maxWorkersValue);

    console.log(
        `[Global Setup] Creating ${maxWorkers} containers for workers (from maxWorkers=${maxWorkersValue})...`,
    );

    const containersMetadata = {};
    const containers = []; // Store container references for teardown

    const containerPromises = [];
    for (let workerId = 1; workerId <= maxWorkers; workerId++) {
        const containerConfig = {
            name: `postgres-test-${workerId}`,
            image: 'postgres',
            tag: '14-alpine',
            ports: [5432],
            env: {
                POSTGRES_USER: testDbConfig.user,
                POSTGRES_PASSWORD: testDbConfig.password,
                POSTGRES_DB: testDbConfig.dbName,
            },
            wait: {
                type: 'ports',
                timeout: 50000,
            },
        };

        containerPromises.push(
            startContainer(containerConfig).then((containerMetaInfo) => {
                const {ip, name, portMappings, container} = containerMetaInfo;
                containersMetadata[workerId.toString()] = {
                    ip,
                    name,
                    portMappings: Object.fromEntries(portMappings),
                };
                containers.push(container);
                console.log(
                    `[Global Setup] Container ${name} started at ${ip}:${portMappings.get(5432)} for worker ${workerId}`,
                );
                return containerMetaInfo;
            }),
        );
    }

    await Promise.all(containerPromises);

    // Store container metadata in a JSON file accessible to all workers
    fs.writeFileSync(
        CONTAINERS_METADATA_PATH,
        JSON.stringify(containersMetadata, null, 2),
        'utf-8',
    );

    // Store container references in global for teardown
    // Note: This only works if setup and teardown run in the same process
    global.__TESTCONTAINERS_ALL_CONTAINERS__ = containers;

    console.log(`[Global Setup] All ${maxWorkers} containers created and metadata saved.`);
};
