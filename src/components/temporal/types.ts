import type {AppContext} from '@gravity-ui/nodekit';
import type {WorkerOptions} from '@temporalio/worker';

export type InitTemporalDeps = {
    ctx: AppContext;
};

export type ActivitiesDeps = {
    ctx: AppContext;
};

export type WorkerQueueConfig = Pick<
    WorkerOptions,
    'activities' | 'workflowsPath' | 'workflowBundle'
>;

export type InitTemporalOptions = {
    queues?: Record<string, WorkerQueueConfig>;
};

export type TemporalConfig = {
    address: string;
    namespace: string;
};
