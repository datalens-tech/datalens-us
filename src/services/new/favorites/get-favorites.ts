import {raw} from 'objection';

import {JoinedFavoriteEntryWorkbook} from '../../../db/presentations/joined-favorite-entry-workbook';
import Utils from '../../../utils';
import {filterEntriesByPermission} from '../entry/utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

interface GetFavoritesArgs {
    orderBy?: {
        field: string;
        direction: 'asc' | 'desc';
    };
    filters?: {
        name?: string;
    };
    page?: number;
    pageSize?: number;
    scope?: string | string[];
    includePermissionsInfo?: boolean;
    ignoreWorkbookEntries?: boolean;
}

export const getFavoritesService = async (
    {ctx, trx}: ServiceArgs,
    {
        orderBy,
        filters,
        page = 0,
        pageSize = 100,
        scope,
        includePermissionsInfo,
        ignoreWorkbookEntries,
    }: GetFavoritesArgs,
) => {
    const {tenantId, user, dlContext} = ctx.get('info');
    const targetTrx = getReplica(trx);

    ctx.log('GET_FAVORITES_REQUEST', {
        tenantId,
        user,
        filters,
        orderBy,
        page,
        pageSize,
        scope,
        includePermissionsInfo,
        ignoreWorkbookEntries,
        dlContext,
    });

    const {login} = user;

    const entries = await JoinedFavoriteEntryWorkbook.findPage({
        where: (builder) => {
            builder.where({
                'favorites.tenantId': tenantId,
                'favorites.login': login,
                'entries.isDeleted': false,
            });
            if (filters && filters.name) {
                builder.where(
                    raw('coalesce(favorites.alias, entries.name)'),
                    'like',
                    `%${Utils.escapeStringForLike(filters.name.toLowerCase())}%`,
                );
            }
            if (scope) {
                const scopes = Array.isArray(scope) ? scope : scope.replace(/\s/g, '').split(',');

                builder.whereIn('scope', ['folder', ...scopes]);
            }

            if (ignoreWorkbookEntries) {
                builder.where('entries.workbookId', null);
            }
        },
        modifier: (builder) => {
            builder.orderByRaw("CASE WHEN scope = 'folder' THEN 0 ELSE 1 END");

            if (orderBy) {
                switch (orderBy.field) {
                    case 'createdAt':
                        builder.orderBy('entries.createdAt', orderBy.direction);
                        builder.orderBy('entries.entryId');
                        break;
                    case 'name':
                        builder.orderBy(
                            raw('COALESCE(favorites.sort_alias, entries.sort_name)'),
                            orderBy.direction,
                        );
                        break;
                }
            }
        },
        page,
        pageSize,
        trx: targetTrx,
    });
    const nextPageToken = Utils.getOptimisticNextPageToken({
        page,
        pageSize,
        curPage: entries,
    });

    const entriesWithPermissionsOnly = await filterEntriesByPermission(
        {ctx},
        {
            entries: entries,
            includePermissionsInfo,
        },
    );

    ctx.log('GET_FAVORITES_SUCCESS');

    const data = {
        nextPageToken,
        entries: entriesWithPermissionsOnly,
    };

    return data;
};
