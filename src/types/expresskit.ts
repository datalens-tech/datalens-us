import type {ZodType} from 'zod';

export type AppRouteApiDocMediaEntry = {
    schema: ZodType<unknown>;
    example?: unknown;
};

export type AppRouteApiDocContent = Partial<Record<string, AppRouteApiDocMediaEntry>>;

export interface AppRouteApiDocRequestBody {
    content: AppRouteApiDocContent;
    description?: string;
    required?: boolean;
}

export interface AppRouteApiDocRequest {
    body?: AppRouteApiDocRequestBody;
    params?: ZodType<unknown>;
    query?: ZodType<unknown>;
    headers?: ZodType<unknown> | ZodType<unknown>[];
}

export interface AppRouteApiDocResponse {
    description: string;
    content?: AppRouteApiDocContent;
}

export interface AppRouteApiMetadata {
    operationId?: string;
    summary?: string;
    description?: string;
    deprecated?: boolean;
    tags?: readonly string[];
    request?: AppRouteApiDocRequest;
    responses?: Record<string, AppRouteApiDocResponse>;
}

export interface PlatformAppRouteParams {
    private?: boolean;
    write?: boolean;
    manualDecodeId?: boolean;
    requireCtxTenantId?: boolean;
}

export interface PlatformAppRouteHandler {
    api?: AppRouteApiMetadata;
    manualDecodeId?: boolean;
}
