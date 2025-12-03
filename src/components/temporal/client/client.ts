import {AppContext} from '@gravity-ui/nodekit';
import {Connection, WorkflowClient} from '@temporalio/client';

import type {ConnectionMetadataProvider} from '../types';
import {getConnectionOptions} from '../utils/connections';

type GetClientArgs = {
    ctx: AppContext;
};

let _connection: Connection | undefined;
let _client: WorkflowClient | undefined;
let _metadataProvider: ConnectionMetadataProvider | undefined;

export const setClientMetadataProvider = (provider: ConnectionMetadataProvider | undefined) => {
    _metadataProvider = provider;
};

const getMetadata = async (ctx: AppContext): Promise<Record<string, string>> => {
    if (!_metadataProvider) {
        return {};
    }

    return _metadataProvider.getMetadata(ctx);
};

const ensureConnection = async (ctx: AppContext) => {
    if (_connection) {
        return _connection;
    }

    _connection = await Connection.connect(getConnectionOptions(ctx));

    return _connection;
};

const ensureClient = async (ctx: AppContext) => {
    if (_client) {
        return _client;
    }

    const {namespace} = ctx.config.temporal || {};
    const connection = await ensureConnection(ctx);

    _client = new WorkflowClient({connection, namespace});

    return _client;
};

const createClientWrapper = (ctx: AppContext, client: WorkflowClient): WorkflowClient => {
    return new Proxy(client, {
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);

            if (typeof value === 'function' && ['start', 'execute'].includes(prop as string)) {
                return async (...args: unknown[]) => {
                    const metadata = await getMetadata(ctx);
                    const connection = await ensureConnection(ctx);

                    return connection.withMetadata(metadata, () => value.apply(target, args));
                };
            }

            return value;
        },
    });
};

export const getClient = async ({ctx}: GetClientArgs): Promise<WorkflowClient> => {
    const client = await ensureClient(ctx);

    return createClientWrapper(ctx, client);
};
