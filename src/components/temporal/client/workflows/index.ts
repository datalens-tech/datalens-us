import {randomUUID} from 'node:crypto';

import type {AppContext} from '@gravity-ui/nodekit';

import {TASK_QUEUE} from '../../constants';
import {example} from '../../workflows/example';
import type {ExampleArgs} from '../../workflows/example/types';
import {withClient} from '../client';

export const runExampleWorkflow = async (ctx: AppContext, {name}: ExampleArgs) => {
    return withClient(ctx, async (client) => {
        const handle = await client.workflow.start(example, {
            args: [{name}],
            taskQueue: TASK_QUEUE,
            workflowId: randomUUID(),
        });

        return await handle.result();
    });
};
