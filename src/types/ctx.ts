import {EntryScope} from '../db/models/new/entry/types';

import {PrivatePermissions} from './models';

export interface UserCtxInfo {
    userId: string;
    login: string;
}

export interface CtxInfo {
    requestId: string;
    tenantId: string;
    workbookId?: string;
    datasetId?: string;
    user: UserCtxInfo;
    isPrivateRoute: boolean;
    isAuditRoute?: boolean;
    dlContext: string;
    onlyPublic: boolean;
    onlyMirrored?: boolean;
    privatePermissions: PrivatePermissions;
    privateRestrictions?: {allowedEntryScopes: EntryScope[]};
}
