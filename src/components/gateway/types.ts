import type {EndpointsConfig} from '@gravity-ui/gateway';

import type {schema} from './schema';

export type GatewaySchemas = {root: typeof schema};

export type SchemaEndpoints = Record<string, Record<string, EndpointsConfig>>;
