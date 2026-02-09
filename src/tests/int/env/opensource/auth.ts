import request from 'supertest';

import {UserRole} from '../../../../components/auth/constants/role';
import {AUTHORIZATION_HEADER, DL_AUTH_HEADER_KEY} from '../../../../const';
import type {CommonAuthArgs} from '../../auth';
import {testUserId, testUserLogin} from '../../constants';

import {OpensourceRole} from './roles';

export {US_ERRORS, app, appConfig, testTenantId, authPrivateRoute, appNodekit} from '../../auth';

export type AuthArgs = CommonAuthArgs & {
    role?: OpensourceRole;
};

export type AuthToken = {
    userId: string;
    login: string;
    roles: `${UserRole}`[];
};

export const auth = (req: request.Test, args: AuthArgs = {}) => {
    const {userId = testUserId, login = testUserLogin, role = OpensourceRole.Viewer} = args;

    let roles: `${UserRole}`[] = [];

    switch (role) {
        case OpensourceRole.Admin:
            roles = [UserRole.Admin];
            break;
        case OpensourceRole.Editor:
            roles = [UserRole.Editor];
            break;
        default:
            roles = [UserRole.Viewer];
            break;
    }

    const authToken: AuthToken = {
        userId,
        login,
        roles,
    };

    req.set(AUTHORIZATION_HEADER, `${DL_AUTH_HEADER_KEY} ${JSON.stringify(authToken)}`);

    return req;
};
