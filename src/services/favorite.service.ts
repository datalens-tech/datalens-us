import Favorite from '../db/models/favorite';
import * as ST from '../types/services.types';

export default class FavoriteService {
    static async get({
        orderBy,
        filters,
        page,
        pageSize,
        scope,
        includePermissionsInfo,
        ignoreWorkbookEntries,
        ctx,
    }: ST.GetFavorite) {
        const {requestId, tenantId, user, dlContext} = ctx.get('info');

        return await Favorite.get({
            requestId,
            tenantId,
            orderBy,
            filters,
            page,
            pageSize,
            scope,
            includePermissionsInfo,
            ignoreWorkbookEntries,
            requestedBy: user,
            dlContext,
            ctx,
        });
    }

    static async add({entryId, ctx}: ST.AddFavorite) {
        const {requestId, tenantId, user, dlContext} = ctx.get('info');

        return await Favorite.add({
            requestId,
            tenantId,
            entryId,
            requestedBy: user,
            dlContext,
            ctx,
        });
    }

    static async delete({entryId, ctx}: ST.DeleteFavorite) {
        const {requestId, tenantId, user, dlContext} = ctx.get('info');

        return await Favorite.delete({
            requestId,
            tenantId,
            entryId,
            requestedBy: user,
            dlContext,
            ctx,
        });
    }

    static async rename({entryId, name, ctx}: ST.RenameFavorite) {
        const {requestId, tenantId, user, dlContext} = ctx.get('info');

        return await Favorite.rename({
            requestId,
            tenantId,
            entryId,
            name,
            requestedBy: user,
            dlContext,
            ctx,
        });
    }
}
