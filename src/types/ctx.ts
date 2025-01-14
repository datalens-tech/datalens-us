import {PrivatePermissions} from './models';
import {ZitadelServiceUser, ZitadelUserRole} from './zitadel';

export type UserCtxInfo = {
    userId: string;
    login: string;
};

export type CtxInfo = {
    requestId: string;
    tenantId: string;
    workbookId?: string;
    userToken?: string;
    user: UserCtxInfo;
    isPrivateRoute: boolean;
    dlContext: string;
    onlyPublic: boolean;
    onlyMirrored?: boolean;
    privatePermissions: PrivatePermissions;
    serviceUser?: ZitadelServiceUser;
    zitadelUserRole?: ZitadelUserRole;
};
