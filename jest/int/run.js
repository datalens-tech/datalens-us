const {execSync} = require('child_process');

const chalk = require('chalk');
const glob = require('glob');

const {calculateWorkerCount} = require('./helpers');

// Get command line arguments
// e.g. pnpm test:int states.test
//      pnpm test:int collections/move
const getTestPatterns = () => {
    if (process.argv.length > 2) {
        return process.argv.slice(2);
    }
    return null;
};

const run = async () => {
    try {
        const appInstallation = process.env.APP_INSTALLATION;

        if (appInstallation !== 'opensource') {
            throw new Error(`Unknown appInstallation – ${appInstallation}`);
        }

        const customPatterns = getTestPatterns();

        const title = customPatterns ? 'Running specific integration tests' : 'Integration tests';

        console.log(`${chalk.bold.hex('#ff6928')(title)}\n`);

        const patterns = ['dist/server/tests/int/env/opensource/suites/**/*.test.js'];

        let suites = [];

        patterns.forEach((pattern) => {
            const files = glob.sync(pattern, {
                root: '../../',
            });

            if (files.length === 0) {
                throw new Error(`The pattern "${pattern}" doesn't match any files.`);
            }

            suites.push(...files);
        });

        if (customPatterns) {
            console.log(`${chalk.bold(`Running tests matching: ${customPatterns.join(', ')}`)}\n`);

            suites = suites.filter((suite) =>
                customPatterns.some((pattern) => suite.includes(pattern)),
            );

            if (suites.length === 0) {
                console.log(
                    chalk.red(
                        `Error: No test files found matching patterns: ${customPatterns.join(', ')}`,
                    ),
                );
                process.exit(1);
            }
        }

        console.log(`${chalk.bold(`Suites count: ${suites.length}`)}\n`);

        const testMatchPattern = `**/(${suites.join('|')})`;

        const maxWorkersValue = process.env.JEST_MAX_WORKERS || '50%';
        const calculatedWorkers = calculateWorkerCount(maxWorkersValue);
        const maxWorkers = Math.min(calculatedWorkers, suites.length);

        console.log(
            `${chalk.bold(`Running tests in parallel with ${maxWorkers} workers (from ${maxWorkersValue}, capped to ${suites.length} suites)...`)}\n`,
        );

        const jestCommand = [
            `JEST_MAX_WORKERS=${maxWorkers}`,
            'JEST_TESTCONTAINERS_CONFIG_PATH=./jest/int/testcontainers-config.js',
            'NODE_TLS_REJECT_UNAUTHORIZED=0',
            'jest',
            '-c ./jest/int/jest.config.js',
            `--testMatch '${testMatchPattern}'`,
            `--maxWorkers=${maxWorkers}`,
            '--logHeapUsage',
        ].join(' ');

        execSync(jestCommand, {stdio: 'inherit'});
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        process.exit(1);
    }
};

run();
