import {raw} from 'objection';
import {z} from 'zod';

import {Model} from '../..';
import {UsValidationError} from '../../../components/errors';
import {zc} from '../../../components/zod';
import {OrderBy, RETURN_NAVIGATION_COLUMNS} from '../../../const';
import {filterEntriesByPermission} from '../../../services/new/entry/utils';
import * as MT from '../../../types/models';
import Utils from '../../../utils';
import {SortFieldConfig, createPaginator} from '../../../utils/cursor-pagination';
import {EntryColumn} from '../new/entry';
import {Favorite, FavoriteEntityType} from '../new/favorite';
import Revision from '../revision';

import {validateInterTenantGetEntries} from './scheme';
import {whereBuilderInterTenantGetEntries} from './utils';

interface NavigationFields extends MT.EntryColumns {
    isLocked?: boolean;
    permissions?: MT.UsPermission;
}
interface Navigation extends NavigationFields {}
class Navigation extends Model {
    static get tableName() {
        return 'entries';
    }

    static get idColumn() {
        return 'entryId';
    }

    static get relationMappings() {
        return {
            revisions: {
                relation: Model.BelongsToOneRelation,
                modelClass: Revision,
                join: {
                    from: 'entries.publishedId',
                    to: 'revisions.revId',
                },
            },
            favorites: {
                relation: Model.BelongsToOneRelation,
                modelClass: Favorite,
                join: {
                    from: 'entries.entryId',
                    to: 'favorites.entityId',
                },
            },
        };
    }

    static async getEntries(
        {
            tenantId,
            ids,
            scope,
            types,
            createdBy,
            metaFilters,
            filters,
            orderBy,
            paginationMode,
            page = 0,
            pageSize = 100,
            pageToken,
            requestedBy,
            includePermissionsInfo,
            ignoreWorkbookEntries,
            ignoreSharedEntries,
            includeData,
            includeLinks,
            excludeLocked,
            dlContext,
        }: MT.GetEntriesConfig,
        ctx: MT.CTX,
    ) {
        ctx.log('GET_ENTRIES_REQUEST', {
            tenantId,
            ids,
            scope,
            types,
            createdBy,
            metaFilters,
            filters,
            orderBy,
            page,
            pageSize,
            pageToken,
            paginationMode,
            requestedBy,
            includePermissionsInfo,
            ignoreWorkbookEntries,
            ignoreSharedEntries,
            includeData,
            includeLinks,
            dlContext,
        });

        const {user} = ctx.get('info');

        const returnColumnNames = includeLinks
            ? [...RETURN_NAVIGATION_COLUMNS, 'links']
            : RETURN_NAVIGATION_COLUMNS;
        const selectColumnNames = [
            ...returnColumnNames,
            'workbooks.title as workbookTitle',
            'collections.title as collectionTitle',
            raw('CASE sub.entity_id WHEN sub.entity_id THEN TRUE ELSE FALSE END AS is_favorite'),
            'unversionedData',
        ];

        if (includeData) {
            selectColumnNames.push('data');
        }

        const baseQuery = Navigation.query(this.replica)
            .select(selectColumnNames)
            .join('revisions', 'entries.savedId', 'revisions.revId')
            .leftJoin('workbooks', 'workbooks.workbookId', 'entries.workbookId')
            .leftJoin('collections', 'collections.collectionId', 'entries.collectionId')
            .leftJoin(
                Favorite.query(this.replica)
                    .select('favorites.entityId')
                    .where('login', user.login)
                    .andWhere('tenantId', '=', tenantId)
                    .andWhere('entityType', '=', FavoriteEntityType.Entry)
                    .as('sub'),
                'sub.entityId',
                'entries.entryId',
            )
            .where({
                isDeleted: false,
                ...(scope ? {scope} : {}),
                'entries.tenantId': tenantId,
            })
            .where((builder) => {
                if (ids) {
                    if (Array.isArray(ids)) {
                        builder.where('entries.entryId', 'in', ids);
                    } else {
                        builder.where('entries.entryId', ids);
                    }
                }
                if (types?.length) {
                    builder.whereIn(EntryColumn.Type, types);
                }
                if (createdBy) {
                    builder.whereIn(
                        'entries.createdBy',
                        Array.isArray(createdBy) ? createdBy : [createdBy],
                    );
                }

                if (ignoreWorkbookEntries) {
                    builder.where('entries.workbookId', null);
                }

                if (ignoreSharedEntries) {
                    builder.where('entries.collectionId', null);
                }

                if (metaFilters) {
                    Object.entries(metaFilters).map(([metaField, value]) => {
                        return builder.whereRaw('meta->>?::text = ?::text', [metaField, value]);
                    });
                }
                if (filters && filters.name) {
                    builder.where(
                        'name',
                        'like',
                        `%${Utils.escapeStringForLike(filters.name.toLowerCase())}%`,
                    );
                }
            })
            .timeout(Model.DEFAULT_QUERY_TIMEOUT);

        let entries: NavigationFields[];
        let nextPageToken: string | undefined;

        if (paginationMode === 'cursor') {
            let sortFields: SortFieldConfig[] = [];
            if (orderBy) {
                const direction = orderBy.direction;

                switch (orderBy.field) {
                    case 'createdAt':
                        sortFields = [
                            {
                                field: `${Navigation.tableName}.${EntryColumn.CreatedAt}`,
                                direction,
                                validate: zc.stringSqlTimestampz(),
                            },
                        ];
                        break;
                    case 'name':
                        sortFields = [
                            {
                                field: `${Navigation.tableName}.${EntryColumn.SortName}`,
                                direction,
                                validate: z.string(),
                            },
                        ];
                        break;
                }
            }

            const paginator = createPaginator({
                sortFields,
                tiebreakerField: {
                    field: `${Navigation.tableName}.${EntryColumn.EntryId}`,
                    direction: OrderBy.Asc,
                    validate: zc.stringBigInt(),
                },
                limit: pageSize,
                pageToken,
            });

            const paginationResult = await paginator.execute(baseQuery);
            entries = paginationResult.result;
            nextPageToken = paginationResult.nextPageToken;
        } else {
            entries = await baseQuery
                .modify((builder) => {
                    if (orderBy) {
                        switch (orderBy.field) {
                            case 'createdAt':
                                builder.orderBy(
                                    `${Navigation.tableName}.${EntryColumn.CreatedAt}`,
                                    orderBy.direction,
                                );
                                break;
                            case 'name':
                                builder.orderBy(
                                    `${Navigation.tableName}.${EntryColumn.SortName}`,
                                    orderBy.direction,
                                );
                                break;
                        }
                    }

                    builder.orderBy(`${Navigation.tableName}.${EntryColumn.EntryId}`);
                })
                .limit(pageSize)
                .offset(pageSize * page);

            nextPageToken = Utils.getOptimisticNextPageToken({
                page,
                pageSize,
                curPage: entries,
            });
        }

        let entriesWithPermissionsOnly = await filterEntriesByPermission<NavigationFields>(
            {ctx},
            {
                entries,
                includePermissionsInfo,
            },
        );

        if (excludeLocked) {
            entriesWithPermissionsOnly = Navigation.filterEntriesByIsLocked(
                entriesWithPermissionsOnly,
            );

            ctx.log('GET_ENTRIES_REQUEST_SUCCESS');

            const data: MT.PaginationEntriesResponse = {
                nextPageToken,
                entries: entriesWithPermissionsOnly,
            };

            return data;
        } else {
            const result = entriesWithPermissionsOnly.map((entry) => {
                if (entry.isLocked) {
                    return {
                        isLocked: entry.isLocked,
                        entryId: entry.entryId,
                        scope: entry.scope,
                        type: entry.type,
                    };
                } else {
                    return entry;
                }
            });

            ctx.log('GET_ENTRIES_REQUEST_SUCCESS');

            const data: MT.PaginationEntriesResponse = {
                nextPageToken,
                entries: result,
            };

            return data;
        }
    }

    static async interTenantGetEntries(
        {
            ids,
            scope,
            type,
            meta,
            creationTimeFilters,
            createdBy,
            orderBy = 'desc',
            page = 0,
            pageSize = 100,
            requestedBy,
        }: MT.InterTenantGetEntriesConfig,
        ctx: MT.CTX,
    ) {
        ctx.log('GET_ENTRIES_IN_TENANTS_REQUEST', {
            ids,
            scope,
            type,
            createdBy,
            meta,
            creationTimeFilters,
            orderBy,
            page,
            pageSize,
            requestedBy,
        });

        const {isValid, validationErrors} = validateInterTenantGetEntries({
            ids,
            scope,
            type,
            createdBy,
            meta,
            creationTimeFilters,
            orderBy,
            page,
            pageSize,
        });

        if (!isValid) {
            throw new UsValidationError({details: {validationErrors}});
        }

        const entries = await Navigation.query(this.replica)
            .select([...RETURN_NAVIGATION_COLUMNS, 'tenantId'])
            .join('revisions', 'entries.savedId', 'revisions.revId')
            .where(
                whereBuilderInterTenantGetEntries({
                    ids,
                    type,
                    createdBy,
                    meta,
                    creationTimeFilters,
                    scope,
                }),
            )
            .limit(pageSize)
            .offset(pageSize * page)
            .orderBy('revisions.updatedAt', orderBy)
            .timeout(Model.DEFAULT_QUERY_TIMEOUT);

        ctx.log('GET_ENTRIES_IN_TENANTS_SUCCESS');

        const data: MT.PaginationEntriesResponse = {
            nextPageToken: Utils.getOptimisticNextPageToken({
                page,
                pageSize,
                curPage: entries,
            }),
            entries: entries,
        };

        return data;
    }

    private static filterEntriesByIsLocked(entries: NavigationFields[] = []): NavigationFields[] {
        return entries.filter(({isLocked}) => !isLocked);
    }
}

export default Navigation;
