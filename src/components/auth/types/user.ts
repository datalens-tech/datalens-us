import type {UserRole} from '../constants/role';
import {ACCESS_TOKEN_TYPE} from '../constants/token';

type CtxUser = {
    type: typeof ACCESS_TOKEN_TYPE.USER;
    userId: string;
    sessionId: string;
    accessToken: string;
    roles: `${UserRole}`[];
};

type CtxServiceAccount = {
    type: typeof ACCESS_TOKEN_TYPE.SERVICE_ACCOUNT;
    userId: string;
    accessToken: string;
    roles: `${UserRole}`[];
};

export type CtxSubject = CtxUser | CtxServiceAccount;
