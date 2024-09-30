import request from 'supertest';
import {
    AUTHORIZATION_HEADER,
    DL_AUTH_HEADER_KEY,
    US_ERRORS,
    US_MASTER_TOKEN_HEADER,
} from '../../const';
import {testUserId, testUserLogin} from './constants';
import {OpensourceRole} from './roles';
import usApp from '../..';
import {ZitadelUserRole} from '../../types/zitadel';
import {CollectionPermission} from '../../entities/collection/types';
import {WorkbookPermission} from '../../entities/workbook/types';
import {ResourceType} from '../../entities/types';

export {US_ERRORS};

export const app = usApp.express;
export const appConfig = usApp.config;

export const testTenantId = 'common';
export const testProjectId = null;

export const getCollectionBinding = (
    collectionId: string,
    permission: `${CollectionPermission}`,
) => {
    return {
        id: collectionId,
        type: ResourceType.Collection as const,
        permission,
    };
};

export const getWorkbookBinding = (workbookId: string, permission: `${WorkbookPermission}`) => {
    return {
        id: workbookId,
        type: ResourceType.Workbook as const,
        permission,
    };
};

export type AccessBinding = ReturnType<typeof getCollectionBinding | typeof getWorkbookBinding>;

export type AuthArgs = {
    userId?: string;
    login?: string;
    role?: OpensourceRole;
    accessBindings?: AccessBinding[];
};

export const auth = (req: request.Test, args: AuthArgs = {}) => {
    const {
        userId = testUserId,
        login = testUserLogin,
        role = OpensourceRole.Viewer,
        accessBindings = [],
    } = args;

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
            accessBindings,
        })}`,
    );

    return req;
};

export const authMasterToken = (req: request.Test) => {
    const token = process.env.MASTER_TOKEN ?? '';
    req.set(US_MASTER_TOKEN_HEADER, token);
    return req;
};
