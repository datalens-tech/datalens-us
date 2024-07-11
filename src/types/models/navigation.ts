import {OrderByDirection} from 'objection';
import {EntriesOrderByFilter, EntriesFilters} from './filters';
import {EntryScope} from './entry';
import {BasicRequestParams, RequestedBy} from './common';

export interface PaginationEntriesResponse {
    nextPageToken?: string;
    entries: any[];
    breadCrumbs?: any[];
}
export interface GetEntriesConfig extends BasicRequestParams {
    tenantId: string;
    ids?: string | string[];
    scope: EntryScope;
    type?: string;
    orderBy?: EntriesOrderByFilter;
    createdBy?: string | string[];
    metaFilters?: object;
    page?: number;
    pageSize?: number;
    filters?: EntriesFilters;
    isPrivateRoute?: any;
    includePermissionsInfo?: boolean;
    ignoreWorkbookEntries?: boolean;
    includeData?: boolean;
    includeLinks?: boolean;
    excludeLocked?: boolean;
}
export interface InterTenantGetEntriesConfig {
    ids?: string | string[];
    scope: EntryScope;
    type?: string;
    orderBy?: OrderByDirection;
    createdBy?: string | string[];
    meta?: object;
    creationTimeFilters?: object;
    page?: number;
    pageSize?: number;
    requestedBy: RequestedBy;
}
