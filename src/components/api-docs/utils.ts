import {AuthPolicy} from '@gravity-ui/expresskit';
import {NodeKit} from '@gravity-ui/nodekit';
import {ZodType} from 'zod';

import {DL_SERVICE_USER_ACCESS_TOKEN} from '../../const';
import type {ExtendedAppRouteDescription} from '../../routes';
import {z} from '../zod';

export const getAdditionalHeaders = (
    routeDescription: ExtendedAppRouteDescription,
    nodekit: NodeKit,
) => {
    const headers: ZodType<unknown>[] = [];
    const security: {[key: string]: unknown}[] = [];

    const {config} = nodekit;

    const authDisabled =
        config.appAuthPolicy === AuthPolicy.disabled ||
        routeDescription.authPolicy === AuthPolicy.disabled;

    if (!authDisabled && (config.zitadelEnabled || config.isAuthEnabled)) {
        security.push({bearerAuth: []});

        if (config.zitadelEnabled) {
            headers.push(
                z.strictObject({
                    ...(config.zitadelEnabled ? {[DL_SERVICE_USER_ACCESS_TOKEN]: z.string()} : {}),
                }),
            );
        }
    }

    return {headers, security};
};
