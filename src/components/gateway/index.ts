import {Request, Response} from '@gravity-ui/expresskit';
import {Headers as DebugHeaders, GatewayConfig, GatewayError} from '@gravity-ui/gateway';
import {AppContext, AppError, NodeKit} from '@gravity-ui/nodekit';

import {IPV6_AXIOS_OPTIONS} from '../../utils/axios';
import {Feature, isEnabledFeature} from '../features';

export const getGatewayConfig = (
    nodekit: NodeKit,
    config?: Partial<GatewayConfig<AppContext, Request, Response>>,
): GatewayConfig<AppContext, Request, Response> => {
    return {
        installation: nodekit.config.appInstallation || 'unknownAppInstallation',
        env: nodekit.config.appEnv || 'unknownEnv',
        axiosConfig: isEnabledFeature(nodekit.ctx, Feature.UseIpV6) ? IPV6_AXIOS_OPTIONS : {},
        caCertificatePath: null,
        withDebugHeaders: false,
        ErrorConstructor: AppError,
        proxyHeaders: [],
        getAuthArgs: () => undefined,
        getAuthHeaders: () => undefined,
        ...(config || {}),
    };
};

export type {GatewayError};

export type GatewayApiErrorResponse<T = GatewayError> = {
    error: T;
    debugHeaders?: DebugHeaders;
};

export function isGatewayError<T = GatewayError>(error: any): error is GatewayApiErrorResponse<T> {
    const target = error?.error;
    return Boolean(target) && typeof target === 'object';
}
