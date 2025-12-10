import {AppContext} from '@gravity-ui/nodekit';
import {Client, Connection} from '@temporalio/client';

import type {ConnectionMetadataProvider} from '../types';
import {getConnectionOptions} from '../utils/connections';

type WithClientCallback<T> = (client: Client) => Promise<T>;

let _connection: Connection | undefined;
let _client: Client | undefined;
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

    _client = new Client({connection, namespace});

    return _client;
};

export const getClient = (ctx: AppContext) => {
    return {
        withClient: async <T>(callback: WithClientCallback<T>): Promise<T> => {
            const client = await ensureClient(ctx);
            const connection = await ensureConnection(ctx);
            const metadata = await getMetadata(ctx);

            return connection.withMetadata(metadata, () => callback(client));
        },
    };
};
