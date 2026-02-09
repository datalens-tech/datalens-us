const {resolve} = require('path');

const jtcPreset = require('@blueground/jest-testcontainers/jest-preset');

const maxWorkers = process.env.JEST_MAX_WORKERS || '50%';

module.exports = {
    ...jtcPreset,
    rootDir: '../../',
    testEnvironment: resolve(__dirname, './test-environment.js'),
    setupFilesAfterEnv: ['jest-extended/all', resolve(__dirname, './setup-after-env.js')],
    testTimeout: 1000 * 500,
    maxWorkers,
    globalSetup: resolve(__dirname, './global-setup.js'),
    globalTeardown: resolve(__dirname, './global-teardown.js'),
};
