import type {RouteConfig as ZodOpenApiRouteConfig} from '@asteasolutions/zod-to-openapi';

import {FeaturesConfig} from '../src/components/features/types';
import type {Registry} from '../src/registry';
import {CtxInfo} from '../src/types/ctx';

export interface SharedAppConfig {
    features: FeaturesConfig;
    dynamicFeaturesEndpoint?: string;

    multitenant: boolean;
    dlsEnabled: boolean;
    tenantIdOverride?: string;

    accessServiceEnabled: boolean;
    accessBindingsServiceEnabled: boolean;

    masterToken: string[];

    zitadelEnabled?: boolean;
    zitadelUri?: string;
    clientId?: string;
    clientSecret?: string;

    swaggerEnabled?: boolean;
}

declare module '@gravity-ui/nodekit' {
    export interface AppConfig extends SharedAppConfig {}

    interface AppDynamicConfig {
        features?: FeaturesConfig;
    }

    interface AppContextParams {
        info: CtxInfo;
        registry: Registry;
    }
}

declare module '@gravity-ui/expresskit' {
    interface AppRouteParams {
        private?: boolean;
        write?: boolean;
        manualDecodeId?: boolean;
    }

    interface AppRouteHandler {
        api?: Omit<ZodOpenApiRouteConfig, 'method' | 'path' | 'responses'> & {
            responses?: ZodOpenApiRouteConfig['responses'];
        };
        manualDecodeId?: boolean;
    }
}
