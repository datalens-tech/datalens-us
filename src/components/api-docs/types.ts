import type {ZodType} from 'zod';

// Copied from @asteasolutions/zod-to-openapi
export type Method = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options' | 'trace';

export type SecuritySchemeType = 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';

export type SecuritySchemeObject = {
    type: SecuritySchemeType;
    description?: string;
    name?: string;
    in?: string;
    scheme?: string;
    bearerFormat?: string;
    openIdConnectUrl?: string;
};

export type GetAdditionalHeadersResult = {
    headers: ZodType<unknown>[];
    security: {[key: string]: []}[];
};

export type GetAdditionalSecuritySchemesResult = Record<string, SecuritySchemeObject>;
