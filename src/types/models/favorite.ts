import {BasicRequestParams} from './common';
import {CTX} from './core';
import {EntriesFilters, EntriesOrderByFilter} from './filters';

export interface GetFavoriteConfig extends BasicRequestParams {
    tenantId?: any;
    ctx: CTX;
    includePermissionsInfo?: boolean;
    ignoreWorkbookEntries?: boolean;
    orderBy?: EntriesOrderByFilter;
    createdBy?: string;
    page?: number;
    pageSize?: number;
    filters?: EntriesFilters;
    scope?: string | string[];
}
export interface AddFavoriteConfig extends BasicRequestParams {
    tenantId?: any;
    entryId?: any;
    ctx: CTX;
}
export interface DeleteFavoriteConfig extends BasicRequestParams {
    tenantId?: any;
    entryId?: any;
    ctx: CTX;
}
export interface RenameFavoriteConfig extends BasicRequestParams {
    entryId: string;
    name: string | null;
    ctx: CTX;
    dlContext?: string;
}
