import type {AppContext} from '@gravity-ui/nodekit';
import {TLSConfig} from '@temporalio/common/lib/internal-non-workflow';
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

export type ConnectionMetadataProvider = {
    getMetadata: (ctx: AppContext) => Promise<Record<string, string>>;
    refreshIntervalMs?: number;
};

export type InitTemporalOptions = {
    queues?: Record<string, WorkerQueueConfig>;
    metadataProvider?: ConnectionMetadataProvider;
};

export type TemporalTlsConfig = {
    serverNameOverride?: string;
    serverRootCACertificatePath?: string;
    clientCertPair?: {
        crtPath: string;
        keyPath: string;
    };
};

export type TemporalConfig = {
    address: string;
    namespace: string;
    tls?: TLSConfig | boolean | null;
};
