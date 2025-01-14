import request from 'supertest';

import usApp from '../..';
import {US_ERRORS, US_MASTER_TOKEN_HEADER} from '../../const';

export type CommonAuthArgs = {
    userId?: string;
    login?: string;
};

export {US_ERRORS};

export const app = usApp.express;
export const appConfig = usApp.config;

export const testTenantId = 'common';

export const authMasterToken = (req: request.Test) => {
    const token = process.env.MASTER_TOKEN ?? '';
    req.set(US_MASTER_TOKEN_HEADER, token);
    return req;
};
