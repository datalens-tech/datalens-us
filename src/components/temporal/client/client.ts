import {AppContext} from '@gravity-ui/nodekit';
import {Connection, WorkflowClient} from '@temporalio/client';

type InitClientArgs = {
    ctx: AppContext;
};

let _client: WorkflowClient;

const initClient = async ({ctx}: InitClientArgs) => {
    const {namespace} = ctx.config.temporal || {};

    if (!_client) {
        const connection = await Connection.connect({
            address: process.env.TEMPORAL_ENDPOINT,
        });

        _client = new WorkflowClient({connection, namespace});
    }
};

export const getClient = async (args: InitClientArgs) => {
    await initClient(args);

    return _client;
};
