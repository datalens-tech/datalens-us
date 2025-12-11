import type {AppContext} from '@gravity-ui/nodekit';
import {NativeConnection, Worker} from '@temporalio/worker';

import {TASK_QUEUE} from './constants';
import type {
    ActivitiesDeps,
    ConnectionMetadataProvider,
    InitTemporalOptions,
    WorkerQueueConfig,
} from './types';
import {getConnectionOptions} from './utils/connections';
import {runWorkerWithRestarts} from './utils/workers';
import {createActivities} from './workflows/activities';

const getDefaultWorkflowsSources = (ctx: AppContext) =>
    ctx.config.appDevMode
        ? {workflowsPath: require.resolve('./workflows')}
        : {
              workflowBundle: {
                  codePath: require.resolve('./workflow-bundle.js'),
              },
          };

const getWorkflowsSources = (ctx: AppContext, queueConfig?: WorkerQueueConfig) => {
    if (queueConfig?.workflowsPath) {
        return {workflowsPath: queueConfig.workflowsPath};
    }
    if (queueConfig?.workflowBundle) {
        return {workflowBundle: queueConfig.workflowBundle};
    }
    return getDefaultWorkflowsSources(ctx);
};

const setupMetadataRefresh = (
    ctx: AppContext,
    connection: NativeConnection,
    metadataProvider: ConnectionMetadataProvider,
): NodeJS.Timeout | undefined => {
    const {refreshIntervalMs} = metadataProvider;

    if (!refreshIntervalMs) {
        return undefined;
    }

    return setInterval(async () => {
        try {
            const metadata = await metadataProvider.getMetadata(ctx);
            connection.setMetadata(metadata);
        } catch (error) {
            ctx.logError('TEMPORAL_METADATA_REFRESH_FAIL', error);
        }
    }, refreshIntervalMs);
};

export const initWorkers = async (deps: ActivitiesDeps, options?: InitTemporalOptions) => {
    const {ctx} = deps;
    const {namespace} = ctx.config.temporal || {};

    const {metadataProvider, queues} = options || {};
    const queueConfig = queues?.[TASK_QUEUE];

    const initialMetadata = metadataProvider ? await metadataProvider.getMetadata(ctx) : undefined;

    const connection = await NativeConnection.connect({
        ...getConnectionOptions(ctx),
        metadata: initialMetadata,
    });

    const metadataRefreshInterval = metadataProvider
        ? setupMetadataRefresh(ctx, connection, metadataProvider)
        : undefined;

    const workflowsSources = getWorkflowsSources(ctx, queueConfig);
    const baseActivities = createActivities(deps);
    const activities = queueConfig?.activities
        ? {...baseActivities, ...queueConfig.activities}
        : baseActivities;

    const runWorker = async () => {
        const worker = await Worker.create({
            ...workflowsSources,
            activities,
            namespace,
            taskQueue: TASK_QUEUE,
            connection,
        });

        await worker.run();
    };

    try {
        await runWorkerWithRestarts({
            ctx,
            workerName: 'CommonUnitedStorage',
            runWorkerFn: runWorker,
        });
    } finally {
        if (metadataRefreshInterval) {
            clearInterval(metadataRefreshInterval);
        }
        await connection.close();
    }
};
