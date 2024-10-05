import request from 'supertest';
import {PlatformRole} from './roles';
import type {CommonAuthArgs} from '../../auth';
import {testUserId, testUserLogin} from '../../constants';
import {AUTHORIZATION_HEADER, DL_AUTH_HEADER_KEY} from '../../../../const';
import {ZitadelUserRole} from '../../../../types/zitadel';
import {CollectionPermission} from '../../../../entities/collection/types';
import {WorkbookPermission} from '../../../../entities/workbook/types';
import {ResourceType} from '../../../../entities/types';

export {US_ERRORS, app, appConfig, testTenantId, testProjectId, authMasterToken} from '../../auth';

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

export type AuthArgs = CommonAuthArgs & {
    role?: PlatformRole;
    accessBindings?: AccessBinding[];
};

export const auth = (req: request.Test, args: AuthArgs = {}) => {
    const {
        userId = testUserId,
        login = testUserLogin,
        role = PlatformRole.Visitor,
        accessBindings = [],
    } = args;

    let zitadelRole: ZitadelUserRole;

    switch (role) {
        case PlatformRole.Admin:
            zitadelRole = ZitadelUserRole.Admin;
            break;
        case PlatformRole.Creator:
            zitadelRole = ZitadelUserRole.Creator;
            break;
        default:
            zitadelRole = ZitadelUserRole.Visitor;
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
