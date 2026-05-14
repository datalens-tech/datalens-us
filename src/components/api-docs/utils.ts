import {
    AppErrorHandler,
    AppRouteHandler,
    AuthPolicy,
    RouteContract,
    ValidationError,
    withContract,
} from '@gravity-ui/expresskit';
import type {SecuritySchemeObject} from '@gravity-ui/expresskit-api';
import {AppContext, AppError, NodeKit} from '@gravity-ui/nodekit';
import {ZodType, z} from 'zod';

import {Feature, isEnabledFeature} from '../../components/features';
import {US_DYNAMIC_MASTER_TOKEN_HEADER, US_ERRORS, US_MASTER_TOKEN_HEADER} from '../../const';
import type {ExtendedAppRouteDescription} from '../../routes';

import {SecurityType} from './constants';
import type {GetAdditionalHeadersResult} from './types';

const getSchema = (content: unknown): unknown => {
    if (!content || typeof content !== 'object') {
        return undefined;
    }

    return Object.values(content)
        .map((c) => c?.schema)
        .find(Boolean);
};
const asZodSchema = (value: unknown): ZodType<unknown> | undefined =>
    value instanceof ZodType ? value : undefined;

export const getAdditionalSecuritySchemes = (
    nodekit: NodeKit,
): Record<string, SecuritySchemeObject> => {
    const result: Record<string, SecuritySchemeObject> = {};

    const {config} = nodekit;

    const authDisabled = config.appAuthPolicy === AuthPolicy.disabled;

    if (!authDisabled) {
        result[SecurityType.MasterToken] = {
            type: 'apiKey',
            in: 'header',
            name: US_MASTER_TOKEN_HEADER,
        };
    }

    if (!authDisabled && isEnabledFeature(nodekit.ctx, Feature.DynamicMasterTokenEnabled)) {
        result[SecurityType.DynamicMasterToken] = {
            type: 'apiKey',
            in: 'header',
            name: US_DYNAMIC_MASTER_TOKEN_HEADER,
        };
    }

    if (!authDisabled && config.authMethods?.includes('datalens-auth')) {
        result[SecurityType.BearerAuth] = {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
        };
    }

    return result;
};

export const getAdditionalHeaders = (
    routeDescription: ExtendedAppRouteDescription,
    nodekit: NodeKit,
): GetAdditionalHeadersResult => {
    const headers: GetAdditionalHeadersResult['headers'] = [];
    const security: GetAdditionalHeadersResult['security'] = [];

    const {config} = nodekit;

    const authDisabled =
        config.appAuthPolicy === AuthPolicy.disabled ||
        routeDescription.authPolicy === AuthPolicy.disabled;

    const appAuthDisabled = config.appAuthPolicy === AuthPolicy.disabled;

    if (!appAuthDisabled && routeDescription.private) {
        security.push({[SecurityType.MasterToken]: []});

        if (isEnabledFeature(nodekit.ctx, Feature.DynamicMasterTokenEnabled)) {
            security.push({[SecurityType.DynamicMasterToken]: []});
        }
    }

    if (!authDisabled && config.authMethods?.includes('datalens-auth')) {
        security.push({[SecurityType.BearerAuth]: []});
    }

    return {headers, security};
};

// TODO: remove after all routes are migrated to the new format
export const registerApiRoute = <F>(
    routeDescription: ExtendedAppRouteDescription<F>,
    nodekit: NodeKit,
): AppRouteHandler => {
    const {handler} = routeDescription;
    const {api} = handler;

    if (!api || !nodekit.config.swaggerEnabled) {
        return handler;
    }

    const requestHeaders = asZodSchema(
        Array.isArray(api.request?.headers) ? api.request.headers[0] : api.request?.headers,
    );

    const requestBodyContent = api.request?.body?.content;
    const requestBodySchema = asZodSchema(getSchema(api.request?.body?.content));
    const requestParams = asZodSchema(api.request?.params);
    const requestQuery = asZodSchema(api.request?.query);
    const responseContent: RouteContract['response']['content'] = {};
    const requestContentTypes = requestBodyContent ? Object.keys(requestBodyContent) : undefined;

    for (const [statusCode, response] of Object.entries(api.responses ?? {})) {
        const parsedStatusCode = Number(statusCode);
        if (!Number.isFinite(parsedStatusCode) || !response) {
            continue;
        }

        const docResponseSchema = asZodSchema(getSchema(response.content));
        if (docResponseSchema) {
            responseContent[parsedStatusCode] = response.description
                ? {schema: docResponseSchema, description: response.description}
                : docResponseSchema;
        } else if (response.description) {
            responseContent[parsedStatusCode] = {description: response.description};
        }
    }

    if (Object.keys(responseContent).length === 0) {
        responseContent[200] = z.any();
    }

    const contract = {
        operationId: api.operationId,
        summary: api.summary,
        description: api.description,
        tags: api.tags ? [...api.tags] : undefined,
        request: {
            body: requestBodySchema,
            params: requestParams,
            query: requestQuery,
            headers: requestHeaders,
            contentType: requestContentTypes,
        },
        response: {
            contentType: 'application/json',
            content: responseContent,
        },
    } satisfies RouteContract;

    return withContract(contract, {manualValidation: true})(handler as any);
};

const REQUEST_PART_PREFIXES = new Set(['body', 'params', 'query', 'headers']);

export const appValidationErrorHandler = (_ctx: AppContext): AppErrorHandler => {
    return (err, _req, _res, next) => {
        if (err instanceof ValidationError) {
            const validationErr = err as ValidationError;
            const issues = (validationErr.zodError?.issues ?? []).map((issue) => {
                const [first, ...rest] = issue.path;
                const path =
                    typeof first === 'string' && REQUEST_PART_PREFIXES.has(first)
                        ? rest
                        : issue.path;
                return {...issue, path};
            });

            next(
                new AppError('Validation error', {
                    code: US_ERRORS.VALIDATION_ERROR,
                    details: issues,
                }),
            );
        } else {
            next(err);
        }
    };
};
