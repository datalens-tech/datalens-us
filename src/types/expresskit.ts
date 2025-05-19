import type {RouteConfig as ZodOpenApiRouteConfig} from '@asteasolutions/zod-to-openapi';

export interface PlatformAppRouteParams {
    private?: boolean;
    write?: boolean;
    manualDecodeId?: boolean;
    requireCtxTenantId?: boolean;
}

export interface PlatformAppRouteHandler {
    api?: Omit<ZodOpenApiRouteConfig, 'method' | 'path' | 'responses'> & {
        responses?: ZodOpenApiRouteConfig['responses'];
    };
    manualDecodeId?: boolean;
}
