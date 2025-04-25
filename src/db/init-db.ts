import * as path from 'path';

import type {NodeKit} from '@gravity-ui/nodekit';
import {initDB as initPostgresDB} from '@gravity-ui/postgreskit';
import {knexSnakeCaseMappers} from 'objection';

import {AppEnv, DEFAULT_QUERY_TIMEOUT} from '../const';
import {getTestDsnList} from '../tests/int/db';
import Utils from '../utils';
import {isTrueArg} from '../utils/env-utils';

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
    ...knexSnakeCaseMappers(),
    debug: isTrueArg(process.env.SQL_DEBUG),
});

export function initDB(nodekit: NodeKit) {
    let dsnList: string;
    if (nodekit.config.appEnv === AppEnv.IntTesting) {
        dsnList = getTestDsnList();
    } else {
        dsnList = Utils.getDsnList();
    }

    const suppressStatusLogs = isTrueArg(process.env.US_SURPRESS_DB_STATUS_LOGS);

    const dispatcherOptions = {
        healthcheckInterval: 5000,
        healthcheckTimeout: 2000,
        suppressStatusLogs,
    };

    const {db, CoreBaseModel, helpers} = initPostgresDB({
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
