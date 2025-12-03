import {setClientMetadataProvider} from './client/client';
import type {InitTemporalDeps, InitTemporalOptions} from './types';
import {initWorkers} from './workers';

export const initTemporal = ({ctx}: InitTemporalDeps, options?: InitTemporalOptions) => {
    setClientMetadataProvider(options?.metadataProvider);

    initWorkers({ctx}, options).catch((error) => {
        ctx.logError('TEMPORAL_WORKER_FAIL', error);

        process.exit(1);
    });
};
