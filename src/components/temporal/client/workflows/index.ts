import {randomUUID} from 'node:crypto';

import type {AppContext} from '@gravity-ui/nodekit';

import {TASK_QUEUE} from '../../constants';
import {example} from '../../workflows/example';
import type {ExampleArgs} from '../../workflows/example/types';
import {getClient} from '../client';

export const runExampleWorkflow = async (ctx: AppContext, {name}: ExampleArgs) => {
    const client = await getClient({ctx});

    const handle = await client.start(example, {
        args: [{name}],
        taskQueue: TASK_QUEUE,
        workflowId: randomUUID(),
    });

    return await handle.result();
};
