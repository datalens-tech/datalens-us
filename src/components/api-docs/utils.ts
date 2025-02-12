import {AuthPolicy} from '@gravity-ui/expresskit';
import {NodeKit} from '@gravity-ui/nodekit';

import {DL_SERVICE_USER_ACCESS_TOKEN, US_MASTER_TOKEN_HEADER} from '../../const';
import type {ExtendedAppRouteDescription} from '../../routes';

import {SecurityType} from './constants';
import type {GetAdditionalHeadersResult, GetAdditionalSecuritySchemesResult} from './types';

export const getAdditionalSecuritySchemes = (
    nodekit: NodeKit,
): GetAdditionalSecuritySchemesResult => {
    const result: GetAdditionalSecuritySchemesResult = {};

    result[SecurityType.MasterToken] = {
        type: 'apiKey',
        in: 'header',
        name: US_MASTER_TOKEN_HEADER,
    };

    const {config} = nodekit;

    const authDisabled = config.appAuthPolicy === AuthPolicy.disabled;

    if (!authDisabled && (config.zitadelEnabled || config.isAuthEnabled)) {
        result[SecurityType.BearerAuth] = {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
        };

        if (config.zitadelEnabled) {
            result[SecurityType.ServiceUserToken] = {
                type: 'apiKey',
                in: 'header',
                name: DL_SERVICE_USER_ACCESS_TOKEN,
            };
        }
    }

    return result;
};

export const getAdditionalHeaders = (
    routeDescription: ExtendedAppRouteDescription,
    nodekit: NodeKit,
): GetAdditionalHeadersResult => {
    const headers: GetAdditionalHeadersResult['headers'] = [];
    const security: GetAdditionalHeadersResult['security'] = [];

    if (routeDescription.private) {
        security.push({[SecurityType.MasterToken]: []});
    }

    const {config} = nodekit;

    const authDisabled =
        config.appAuthPolicy === AuthPolicy.disabled ||
        routeDescription.authPolicy === AuthPolicy.disabled;

    if (!authDisabled && (config.zitadelEnabled || config.isAuthEnabled)) {
        security.push({[SecurityType.BearerAuth]: []});

        if (config.zitadelEnabled) {
            security.push({[SecurityType.ServiceUserToken]: []});
        }
    }

    return {headers, security};
};
