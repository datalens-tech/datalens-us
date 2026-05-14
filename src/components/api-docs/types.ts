import type {SecuritySchemeObject} from '@gravity-ui/expresskit-api';

export type AdditionalHeader = {
    name: string;
    required?: boolean;
    schema?: Record<string, unknown>;
    description?: string;
};

export type GetAdditionalHeadersResult = {
    headers: AdditionalHeader[];
    security: {[key: string]: []}[];
};

export type GetAdditionalSecuritySchemesResult = Record<string, SecuritySchemeObject>;
