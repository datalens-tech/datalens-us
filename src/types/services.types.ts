import type {OrderByDirection} from 'objection';

import {
    CTX,
    DlsPermissionsMode,
    EntriesFilters,
    EntriesOrderByFilter,
    EntryColumns,
    EntryScope,
    RevisionColumns,
    SyncLinks,
    TemplateData,
    WorkbookColumns,
} from './models';

export interface ServiceResponse<T extends any = any> {
    code: number;
    response: T;
}

export interface StdServiceParams {
    ctx: CTX;
}
export interface PrivateGetEntriesByKey extends StdServiceParams {
    key: string;
    branch?: string;
}

export interface CreateEntry extends StdServiceParams {
    name?: string;
    workbookId?: WorkbookColumns['workbookId'];
    scope: EntryScope;
    type?: EntryColumns['type'];
    key?: EntryColumns['key'];
    meta?: RevisionColumns['meta'];
    hidden?: EntryColumns['hidden'];
    mirrored?: EntryColumns['mirrored'];
    mode?: 'save' | 'publish';
    recursion?: boolean;
    createdBy?: EntryColumns['createdBy'];
    data?: RevisionColumns['data'];
    unversionedData?: EntryColumns['unversionedData'];
    links?: SyncLinks;
    permissionsMode?: DlsPermissionsMode;
    includePermissionsInfo?: boolean;
    initialPermissions?: any;
    initialParentId?: string;
    checkServicePlan?: string;
}

export interface ResolveTenantIdByEntryId extends StdServiceParams {
    entryId: string;
}

interface NavigationServiceParams extends StdServiceParams {
    scope: EntryScope;
    page?: number;
    pageSize?: number;
}
export interface GetEntries extends NavigationServiceParams {
    ids?: string | string[];
    type?: string;
    orderBy?: EntriesOrderByFilter;
    createdBy?: string | string[];
    meta?: object;
    filters?: EntriesFilters;
    isPrivateRoute?: any;
    includePermissionsInfo?: boolean;
    ignoreWorkbookEntries?: boolean;
    includeData?: boolean;
    includeLinks?: boolean;
    excludeLocked?: boolean;
}
export interface InterTenantGetEntries extends NavigationServiceParams {
    ids?: string | string[];
    type?: string;
    orderBy?: OrderByDirection;
    createdBy?: string | string[];
    meta?: object;
    creationTime?: object;
}
export interface GetDraft extends StdServiceParams {
    draftId: string;
}
export interface GetAllDraftsByEntry extends StdServiceParams {
    entryId: string;
}
export interface CreateDraft extends StdServiceParams {
    entryId: string;
    meta?: {};
    data?: {};
}
export interface DeleteAllDraftsByEntry extends StdServiceParams {
    entryId: string;
}

export interface GetFavorite extends StdServiceParams {
    orderBy?: EntriesOrderByFilter;
    filters?: EntriesFilters;
    createdBy?: string;
    page?: number;
    pageSize?: number;
    scope?: string | string[];
    includePermissionsInfo?: boolean;
    ignoreWorkbookEntries?: boolean;
}
export interface AddFavorite extends StdServiceParams {
    entryId: string;
}
export interface RenameFavorite extends StdServiceParams {
    entryId: string;
    name: string | null;
}
export interface DeleteFavorite extends StdServiceParams {
    entryId: string;
}

export interface VerifyLockExistence extends StdServiceParams {
    entryId: string;
}
export interface LockEntry extends StdServiceParams {
    entryId: string;
    duration: string;
    force?: boolean;
}
export interface UnlockEntry extends StdServiceParams {
    entryId: string;
    lockToken: string;
    force?: boolean;
}
export interface ExtendLock extends StdServiceParams {
    entryId: string;
    duration: string;
    lockToken: string;
    force?: boolean;
}

export interface GetTemplates extends StdServiceParams {}
export interface GetTemplate extends StdServiceParams {
    name: string;
}
export interface CreateTemplate extends StdServiceParams {
    name: string;
    data: TemplateData;
}
export interface UpdateTemplate extends StdServiceParams {
    name: string;
    data: TemplateData;
}
export interface DeleteTemplate extends StdServiceParams {
    name: string;
}

export interface GetTenants extends StdServiceParams {}
export interface GetTenant extends StdServiceParams {
    tenantId: string;
}
export interface CreateTenant extends StdServiceParams {
    tenantId: string;
    cloudId: string;
}
export interface EnableTenant extends StdServiceParams {
    tenantId: string;
}
export interface QetCloudQuota extends StdServiceParams {
    cloudId: string;
}
