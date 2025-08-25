const {execSync} = require('child_process');

const chalk = require('chalk');
const glob = require('glob');
const _ = require('lodash');

const run = async () => {
    try {
        const appInstallation = process.env.APP_INSTALLATION;

        if (appInstallation !== 'opensource') {
            throw new Error(`Unknown appInstallation – ${appInstallation}`);
        }

        const chunkSize = parseInt(process.env.TEST_CHUNK_SIZE, 10) || 50;

        console.log(`${chalk.bold.hex('#ff6928')('Integration tests')}\n`);

        const patterns = ['dist/server/tests/int/env/opensource/suites/**/*.test.js'];

        const suites = [];

        patterns.forEach((pattern) => {
            const files = glob.sync(pattern, {
                root: '../../',
            });

            if (files.length === 0) {
                throw new Error(`The pattern "${pattern}" doesn't match any files.`);
            }

            suites.push(...files);
        });

        const chunkedSuites = _.chunk(suites, chunkSize);

        console.log(`${chalk.bold(`Suites count: ${suites.length}`)}\n`);

        const manyChunks = chunkedSuites.length > 1;

        if (manyChunks) {
            console.log(`${chalk.bold(`Chunks count: ${chunkedSuites.length}`)}\n`);
        }

        for (let i = 0; i < chunkedSuites.length; i++) {
            if (manyChunks) {
                const message = `Chunk №${i + 1} started`;
                console.log(`${chalk.bold(message)}\n${'-'.repeat(message.length)}\n`);
            }

            execSync(
                `JEST_TESTCONTAINERS_CONFIG_PATH='./jest/int/testcontainers-config.js' NODE_TLS_REJECT_UNAUTHORIZED=0 jest -c './jest/int/jest.config.js' --testMatch '**/(${chunkedSuites[i].join('|')})' --logHeapUsage --detectOpenHandles`,
                {stdio: 'inherit'},
            );

            console.log('\n');
        }
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        process.exit(1);
    }
};

run();
