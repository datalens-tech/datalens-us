import type {UserRole} from '../constants/role';
import {ACCESS_TOKEN_TYPE} from '../constants/token';

export type UserAccessTokenPayload = {
    type?: typeof ACCESS_TOKEN_TYPE.USER;
    userId: string;
    sessionId: string;
    roles: `${UserRole}`[];
    iat: number;
    exp: number;
};

export type ServiceAccountAccessTokenPayload = {
    userId: string;
    roles: `${UserRole}`[];
    type: typeof ACCESS_TOKEN_TYPE.SERVICE_ACCOUNT;
    iat: number;
    exp: number;
};

export type SubjectAccessTokenPayload = UserAccessTokenPayload | ServiceAccountAccessTokenPayload;
