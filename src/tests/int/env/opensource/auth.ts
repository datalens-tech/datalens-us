import request from 'supertest';

import {AUTHORIZATION_HEADER, DL_AUTH_HEADER_KEY} from '../../../../const';
import {ZitadelUserRole} from '../../../../types/zitadel';
import type {CommonAuthArgs} from '../../auth';
import {testUserId, testUserLogin} from '../../constants';

import {OpensourceRole} from './roles';

export {US_ERRORS, app, appConfig, testTenantId, authMasterToken, appNodekit} from '../../auth';

export type AuthArgs = CommonAuthArgs & {
    role?: OpensourceRole;
};

export const auth = (req: request.Test, args: AuthArgs = {}) => {
    const {userId = testUserId, login = testUserLogin, role = OpensourceRole.Viewer} = args;

    let zitadelRole: ZitadelUserRole;

    switch (role) {
        case OpensourceRole.Admin:
            zitadelRole = ZitadelUserRole.Admin;
            break;
        case OpensourceRole.Editor:
            zitadelRole = ZitadelUserRole.Editor;
            break;
        default:
            zitadelRole = ZitadelUserRole.Viewer;
            break;
    }

    req.set(
        AUTHORIZATION_HEADER,
        `${DL_AUTH_HEADER_KEY} ${JSON.stringify({
            userId,
            login,
            role: zitadelRole,
        })}`,
    );

    return req;
};
