import {AuthPolicy} from '@gravity-ui/expresskit';
import {NodeKit} from '@gravity-ui/nodekit';
import {ZodType} from 'zod';

import {AUTHORIZATION_HEADER} from '../../const';
import type {ExtendedAppRouteDescription} from '../../routes';
import {z} from '../zod';

export const getAdditionalHeaders = (
    routeDescription: ExtendedAppRouteDescription,
    nodekit: NodeKit,
) => {
    const headers: ZodType<unknown>[] = [];

    const {config} = nodekit;

    const authDisabled =
        config.appAuthPolicy === AuthPolicy.disabled ||
        routeDescription.authPolicy === AuthPolicy.disabled;

    if (!authDisabled && (config.zitadelEnabled || config.isAuthEnabled)) {
        headers.push(
            z.strictObject({
                [AUTHORIZATION_HEADER]: z.string(),
            }),
        );
    }

    return headers;
};
