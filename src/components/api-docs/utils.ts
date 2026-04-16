import {AuthPolicy} from '@gravity-ui/expresskit';
import {NodeKit} from '@gravity-ui/nodekit';

import {Feature, isEnabledFeature} from '../../components/features';
import {US_DYNAMIC_MASTER_TOKEN_HEADER, US_MASTER_TOKEN_HEADER} from '../../const';
import type {ExtendedAppRouteDescription} from '../../routes';

import {SecurityType} from './constants';
import type {GetAdditionalHeadersResult, GetAdditionalSecuritySchemesResult} from './types';

export const getAdditionalSecuritySchemes = (
    nodekit: NodeKit,
): GetAdditionalSecuritySchemesResult => {
    const result: GetAdditionalSecuritySchemesResult = {};

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

    if (!authDisabled) {
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

    if (!authDisabled) {
        security.push({[SecurityType.BearerAuth]: []});
    }

    return {headers, security};
};
