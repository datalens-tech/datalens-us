import type {AppContext} from '@gravity-ui/nodekit';
import {NativeConnection, Worker} from '@temporalio/worker';

import {TASK_QUEUE} from './constants';
import type {ActivitiesDeps, InitTemporalOptions, WorkerQueueConfig} from './types';
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

export const initWorkers = async (deps: ActivitiesDeps, options?: InitTemporalOptions) => {
    const {ctx} = deps;
    const {address, namespace} = ctx.config.temporal || {};

    const connection = await NativeConnection.connect({
        address,
    });

    const queueConfig = options?.queues?.[TASK_QUEUE];
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
        await connection.close();
    }
};
