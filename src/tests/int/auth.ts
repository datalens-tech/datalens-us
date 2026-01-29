import request from 'supertest';

import usApp from '../..';
import {US_DYNAMIC_MASTER_TOKEN_HEADER, US_ERRORS} from '../../const';

export type CommonAuthArgs = {
    userId?: string;
    login?: string;
};

export {US_ERRORS};

export const app = usApp.express;
export const appConfig = usApp.config;
export const appNodekit = usApp.nodekit;

export const testTenantId = 'common';

export type AuthPrivateRouteOptions = {
    serviceId?: string;
};

export const authPrivateRoute = (req: request.Test, options: AuthPrivateRouteOptions = {}) => {
    const {serviceId = 'test-service'} = options;
    const token = JSON.stringify({serviceId});
    req.set(US_DYNAMIC_MASTER_TOKEN_HEADER, token);
    return req;
};
