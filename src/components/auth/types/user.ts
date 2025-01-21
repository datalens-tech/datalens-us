import type {UserRole} from '../constants/role';

export interface CtxUser {
    userId: string;
    sessionId: string;
    accessToken: string;
    roles: `${UserRole}`[];
}
