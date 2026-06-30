import Navigation from '../db/models/navigation';
import * as ST from '../types/services.types';

import {ReturnNavigationColumnsEntry} from './entry/types';

export type LockedNavigationEntry = {
    entryId: string;
    scope: string;
    type: string;
    isLocked: true;
};

export type FullNavigationEntry = ReturnNavigationColumnsEntry & {
    workbookTitle?: string | null;
    collectionTitle?: string | null;
    isFavorite?: boolean;
    unversionedData?: Record<string, unknown> | null;
    data?: Record<string, unknown> | null;
    links?: Record<string, unknown> | null;
    permissions?: Record<string, boolean>;
    isLocked?: false;
};

export type NavigationEntry = LockedNavigationEntry | FullNavigationEntry;

export interface GetEntriesResult {
    entries: NavigationEntry[];
    nextPageToken?: string;
}

export default class NavigationService {
    static async getEntries({
        ids,
        scope,
        types,
        createdBy,
        orderBy,
        meta,
        filters,
        page,
        pageSize,
        pageToken,
        paginationMode,
        includePermissionsInfo,
        ignoreWorkbookEntries,
        ignoreSharedEntries,
        includeData,
        includeLinks,
        excludeLocked,
        ctx,
    }: ST.GetEntries) {
        const {requestId, tenantId, user, dlContext} = ctx.get('info');

        const result = await Navigation.getEntries(
            {
                requestId,
                tenantId,
                ids,
                scope,
                types,
                createdBy,
                orderBy,
                metaFilters: meta,
                filters,
                page,
                pageSize,
                pageToken,
                paginationMode,
                includePermissionsInfo,
                ignoreWorkbookEntries,
                ignoreSharedEntries,
                includeData,
                includeLinks,
                excludeLocked,
                requestedBy: user,
                dlContext,
            },
            ctx,
        );

        return result;
    }

    static async interTenantGetEntries({
        ids,
        scope,
        type,
        createdBy,
        orderBy,
        meta,
        page,
        pageSize,
        creationTime,
        ctx,
    }: ST.InterTenantGetEntries) {
        const {user} = ctx.get('info');

        return await Navigation.interTenantGetEntries(
            {
                ids,
                scope,
                type,
                createdBy,
                orderBy,
                meta,
                creationTimeFilters: creationTime,
                page,
                pageSize,
                requestedBy: user,
            },
            ctx,
        );
    }
}
