import {PrivatePermissions} from './models';
import {ZitadelServiceUser, ZitadelUserRole} from './zitadel';

export interface UserCtxInfo {
    userId: string;
    login: string;
}

export interface CtxInfo {
    requestId: string;
    tenantId: string;
    workbookId?: string;
    datasetId?: string;
    userToken?: string;
    user: UserCtxInfo;
    isPrivateRoute: boolean;
    dlContext: string;
    onlyPublic: boolean;
    onlyMirrored?: boolean;
    privatePermissions: PrivatePermissions;
    serviceUser?: ZitadelServiceUser;
    zitadelUserRole?: ZitadelUserRole;
}
