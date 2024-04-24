import * as path from 'path';
import type {NodeKit} from '@gravity-ui/nodekit';
import {initDB as initPosgresDB} from '@gravity-ui/postgreskit';
import {AppEnv, DEFAULT_QUERY_TIMEOUT} from '../const';
import {getTestDsnList} from '../tests/int/db';
import Utils from '../utils';

interface OrigImplFunction {
    (snakeCaseFormat: string): string;
}

function convertCamelCase(dataObj = {}) {
    return Object.entries(dataObj).reduce((dataObjFormed: {[key: string]: any}, objEntry) => {
        const [property, value] = objEntry;

        const propertyCamelCase = Utils.camelCase(property).replace(
            /(uuid)/gi,
            (foundValue: string) => foundValue.toUpperCase(),
        );

        dataObjFormed[propertyCamelCase] = value;

        return dataObjFormed;
    }, {});
}

export const getKnexOptions = () => ({
    client: 'pg',
    pool: {
        min: 0,
        max: 15,
        acquireTimeoutMillis: 40000,
        createTimeoutMillis: 50000,
        idleTimeoutMillis: 45000,
        reapIntervalMillis: 1000,
    },
    acquireConnectionTimeout: 10000,
    migrations: {
        directory: path.resolve(__dirname, 'migrations'),
        tableName: 'migrations',
        extension: 'js',
        loadExtensions: ['.js'],
    },
    seeds: {
        directory: path.resolve(__dirname, 'seeds'),
        loadExtensions: ['.js'],
    },
    postProcessResponse: (result: any): any => {
        let dataFormed;

        if (Array.isArray(result)) {
            dataFormed = result.map((dataObj) => convertCamelCase(dataObj));
        } else if (result !== null && typeof result === 'object') {
            dataFormed = convertCamelCase(result);
        } else {
            dataFormed = result;
        }

        return dataFormed;
    },
    wrapIdentifier: (value: string, origImpl: OrigImplFunction): string => {
        const snakeCaseFormat = value.replace(/(?=[A-Z])/g, '_').toLowerCase();

        return origImpl(snakeCaseFormat);
    },
    debug: Utils.isTrueArg(process.env.SQL_DEBUG),
});

export function initDB(nodekit: NodeKit) {
    let dsnList: string;
    if (nodekit.config.appEnv === AppEnv.IntTesting) {
        const globals = global as unknown as {
            __TESTCONTAINERS_POSTGRE_IP__: string;
            __TESTCONTAINERS_POSTGRE_PORT_5432__: string;
        };
        dsnList = getTestDsnList({
            host: globals.__TESTCONTAINERS_POSTGRE_IP__,
            port: globals.__TESTCONTAINERS_POSTGRE_PORT_5432__,
        });
    } else {
        dsnList = Utils.getDsnList();
    }

    const suppressStatusLogs = Utils.isTrueArg(process.env.US_SURPRESS_DB_STATUS_LOGS);

    const dispatcherOptions = {
        healthcheckInterval: 5000,
        healthcheckTimeout: 2000,
        suppressStatusLogs,
    };

    const {db, CoreBaseModel, helpers} = initPosgresDB({
        connectionString: dsnList,
        dispatcherOptions,
        knexOptions: getKnexOptions(),
        logger: {
            info: (...args) => nodekit.ctx.log(...args),
            error: (...args) => nodekit.ctx.logError(...args),
        },
    });

    async function getId() {
        const queryResult = await db.primary.raw('select get_id() as id');
        return queryResult.rows[0].id;
    }

    class Model extends CoreBaseModel {
        static DEFAULT_QUERY_TIMEOUT = DEFAULT_QUERY_TIMEOUT;
    }

    return {db, Model, getId, helpers};
}
