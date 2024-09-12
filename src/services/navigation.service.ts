import Navigation from '../db/models/navigation';
import * as ST from '../types/services.types';

export default class NavigationService {
    static async getEntries({
        ids,
        scope,
        type,
        createdBy,
        orderBy,
        meta,
        filters,
        page,
        pageSize,
        includePermissionsInfo,
        ignoreWorkbookEntries,
        includeData,
        includeLinks,
        excludeLocked,
        ctx,
    }: ST.GetEntries) {
        const {requestId, tenantId, user, dlContext} = ctx.get('info');

        return await Navigation.getEntries(
            {
                requestId,
                tenantId,
                ids,
                scope,
                type,
                createdBy,
                orderBy,
                metaFilters: meta,
                filters,
                page,
                pageSize,
                includePermissionsInfo,
                ignoreWorkbookEntries,
                includeData,
                includeLinks,
                excludeLocked,
                requestedBy: user,
                dlContext,
            },
            ctx,
        );
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
