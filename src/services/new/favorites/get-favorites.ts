import {raw} from 'objection';

import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {EntryScope} from '../../../db/models/new/entry/types';
import {Favorite, FavoriteColumn} from '../../../db/models/new/favorite';
import {FavoriteEntryPresentation} from '../../../db/models/new/favorite/presentations/favorite-entry-presentation';
import Utils from '../../../utils';
import {filterEntriesByPermission} from '../entry/utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

interface GetFavoritesArgs {
    orderBy?: {
        field: 'name' | 'createdAt';
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

export const getFavorites = async (
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

    const entries = await FavoriteEntryPresentation.getSelectQuery(getReplica(trx))
        .where({
            [`${Favorite.tableName}.${FavoriteColumn.TenantId}`]: tenantId,
            [`${Favorite.tableName}.${FavoriteColumn.Login}`]: login,
            [`${Entry.tableName}.${EntryColumn.IsDeleted}`]: false,
        })
        .where((builder) => {
            if (filters && filters.name) {
                builder.where(
                    raw('COALESCE(??, ??)', [
                        `${Favorite.tableName}.${FavoriteColumn.Alias}`,
                        `${Entry.tableName}.${EntryColumn.Name}`,
                    ]),
                    'like',
                    `%${Utils.escapeStringForLike(filters.name.toLowerCase())}%`,
                );
            }
            if (scope) {
                const scopes = Array.isArray(scope) ? scope : scope.replace(/\s/g, '').split(',');

                builder.whereIn(`${Entry.tableName}.${EntryColumn.Scope}`, [
                    EntryScope.Folder,
                    ...scopes,
                ]);
            }

            if (ignoreWorkbookEntries) {
                builder.where(`${Entry.tableName}.${EntryColumn.WorkbookId}`, null);
            }
        })
        .orderByRaw('CASE WHEN ?? = ? THEN 0 ELSE 1 END', [
            `${Entry.tableName}.${EntryColumn.Scope}`,
            EntryScope.Folder,
        ])
        .modify((builder) => {
            if (orderBy) {
                switch (orderBy.field) {
                    case 'createdAt':
                        builder.orderBy(
                            `${Entry.tableName}.${EntryColumn.CreatedAt}`,
                            orderBy.direction,
                        );
                        builder.orderBy(`${Entry.tableName}.${EntryColumn.EntryId}`);
                        break;
                    case 'name':
                        builder.orderBy(
                            raw('COALESCE(??, ??)', [
                                `${Favorite.tableName}.${FavoriteColumn.SortAlias}`,
                                `${Entry.tableName}.${EntryColumn.SortName}`,
                            ]),
                            orderBy.direction,
                        );
                        break;
                }
            }
        })
        .limit(pageSize)
        .offset(pageSize * page)
        .timeout(FavoriteEntryPresentation.DEFAULT_QUERY_TIMEOUT);

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
