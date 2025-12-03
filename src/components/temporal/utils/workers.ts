import type {AppContext} from '@gravity-ui/nodekit';

const DEFAULT_WORKERS_RESTARTS_COUNT = 3;

export const runWorkerWithRestarts = async ({
    ctx,
    workerName,
    runWorkerFn,
    maxRestarts = DEFAULT_WORKERS_RESTARTS_COUNT,
}: {
    ctx: AppContext;
    workerName: string;
    runWorkerFn: () => Promise<void>;
    maxRestarts?: number;
}) => {
    let restarts = 0;

    const runWithRestart = async () => {
        try {
            ctx.log(`Starting ${workerName} worker (attempt ${restarts + 1})`);
            await runWorkerFn();
        } catch (error) {
            ctx.logError(`${workerName} worker failed:`, error);

            restarts++;

            if (restarts <= maxRestarts) {
                ctx.log(
                    `Restarting ${workerName} worker (${restarts}/${maxRestarts} restarts used).`,
                );
                await runWithRestart();
            } else {
                ctx.logError(`${workerName} worker failed after ${maxRestarts} restart attempts.`);

                throw error;
            }
        }
    };

    return runWithRestart();
};
