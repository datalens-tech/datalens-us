import {proxyActivities} from '@temporalio/workflow';

import type {createActivities} from './activities';
import type {ExampleArgs, ExampleResult} from './types';

const {greet} = proxyActivities<ReturnType<typeof createActivities>>({
    retry: {
        initialInterval: '1 sec',
        maximumInterval: '20 sec',
        backoffCoefficient: 3,
        maximumAttempts: 5,
    },
    startToCloseTimeout: '20 sec',
});

export async function example({name}: ExampleArgs): Promise<ExampleResult> {
    const message = await greet({name});

    return {
        message,
    };
}
