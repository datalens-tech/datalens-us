import {BasicRequestParams} from './common';
import {CTX} from './core';
import {EntriesOrderByFilter, EntriesFilters} from './filters';
import {TransactionOrKnex} from 'objection';

export interface GetFavoriteConfig extends BasicRequestParams {
    tenantId?: any;
    ctx: CTX;
    trx?: TransactionOrKnex;
    includePermissionsInfo?: boolean;
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
