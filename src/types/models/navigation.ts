import {OrderByDirection} from 'objection';

import {OrderBy} from '../../const';

import {BasicRequestParams, RequestedBy} from './common';
import {EntryScope} from './entry';
import {EntriesFilters, EntriesOrderByFilter} from './filters';

export interface PaginationEntriesResponse {
    nextPageToken?: string;
    entries: any[];
    breadCrumbs?: any[];
}
export interface GetEntriesConfig extends BasicRequestParams {
    tenantId: string;
    ids?: string | string[];
    scope?: EntryScope;
    types?: string[];
    orderBy?: EntriesOrderByFilter<string, OrderBy>;
    createdBy?: string | string[];
    metaFilters?: object;
    paginationMode: 'offset' | 'cursor';
    page?: number;
    pageSize?: number;
    pageToken?: string;
    filters?: EntriesFilters;
    isPrivateRoute?: any;
    includePermissionsInfo?: boolean;
    ignoreWorkbookEntries?: boolean;
    ignoreSharedEntries?: boolean;
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
