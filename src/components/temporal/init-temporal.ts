import type {InitTemporalDeps, InitTemporalOptions} from './types';
import {initWorkers} from './workers';

export const initTemporal = ({ctx}: InitTemporalDeps, options?: InitTemporalOptions) => {
    initWorkers({ctx}, options).catch((error) => {
        ctx.logError('TEMPORAL_WORKER_FAIL', error);

        process.exit(1);
    });
};
