import {BasicRequestParams} from './common';

export interface CheckLockConfig {
    entryId: string;
    lockToken?: string;
}
export interface VerifyExistenceConfig extends BasicRequestParams {
    tenantId?: any;
    entryId?: any;
    isPrivateRoute?: boolean;
}
export interface LockConfig extends BasicRequestParams {
    tenantId?: any;
    entryId?: any;
    duration?: any;
    force?: any;
    isPrivateRoute?: boolean;
}
export interface UnlockConfig extends BasicRequestParams {
    tenantId?: any;
    entryId?: any;
    lockToken?: any;
    force?: any;
    isPrivateRoute?: boolean;
}
export interface ExtendLockConfig extends BasicRequestParams {
    tenantId?: any;
    entryId?: any;
    duration?: any;
    lockToken?: any;
    force?: any;
    isPrivateRoute?: boolean;
}
