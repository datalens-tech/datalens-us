import {raw} from 'objection';
import {Model} from '../..';
import Utils from '../../../utils';
import Revision from '../revision';
import Favorite from '../favorite';
import {AppError} from '@gravity-ui/nodekit';
import * as MT from '../../../types/models';
import {RETURN_NAVIGATION_COLUMNS, US_ERRORS} from '../../../const';
import {validateGetEntries, validateInterTenantGetEntries} from './scheme';
import {whereBuilderInterTenantGetEntries} from './utils';
import {filterEntriesByPermission} from '../../../services/new/entry/utils';

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
                    to: 'favorites.entryId',
                },
            },
        };
    }

    static async getEntries(
        {
            tenantId,
            ids,
            scope,
            type,
            createdBy,
            metaFilters,
            filters,
            orderBy,
            page = 0,
            pageSize = 100,
            requestedBy,
            includePermissionsInfo,
            ignoreWorkbookEntries,
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
            type,
            createdBy,
            metaFilters,
            filters,
            orderBy,
            page,
            pageSize,
            requestedBy,
            includePermissionsInfo,
            ignoreWorkbookEntries,
            includeData,
            includeLinks,
            dlContext,
        });

        const {user} = ctx.get('info');

        const {isValid, validationErrors} = validateGetEntries({
            tenantId,
            ids,
            scope,
            type,
            createdBy,
            metaFilters,
            filters,
            orderBy,
            page,
            pageSize,
            includePermissionsInfo,
            includeData,
            includeLinks,
        });

        if (!isValid) {
            throw new AppError('Validation error', {
                code: US_ERRORS.VALIDATION_ERROR,
                details: {validationErrors},
            });
        }

        const returnColumnNames = includeLinks
            ? RETURN_NAVIGATION_COLUMNS.concat('links')
            : RETURN_NAVIGATION_COLUMNS;
        const selectColumnNames = [
            ...returnColumnNames,
            'workbooks.title as workbookTitle',
            raw('CASE sub.entry_id WHEN sub.entry_id THEN TRUE ELSE FALSE END AS is_favorite'),
        ];

        if (includeData) {
            selectColumnNames.push('data');
        }

        const entries = await Navigation.query(this.replica)
            .select(selectColumnNames)
            .join('revisions', 'entries.savedId', 'revisions.revId')
            .leftJoin('workbooks', 'workbooks.workbookId', 'entries.workbookId')
            .leftJoin(
                Favorite.query(this.replica)
                    .select('favorites.entryId')
                    .where('login', user.login)
                    .andWhere('tenantId', '=', tenantId)
                    .as('sub'),
                'sub.entryId',
                'entries.entryId',
            )
            .where({
                isDeleted: false,
                scope,
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
                if (type) {
                    builder.where('type', type);
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
            .modify((builder) => {
                if (orderBy) {
                    switch (orderBy.field) {
                        case 'createdAt':
                            builder.orderBy('entries.createdAt', orderBy.direction);
                            builder.orderBy('entries.entryId');
                            break;
                        case 'name':
                            builder.orderBy('sortName', orderBy.direction);
                            break;
                    }
                }
            })
            .limit(pageSize)
            .offset(pageSize * page)
            .timeout(Model.DEFAULT_QUERY_TIMEOUT);

        const nextPageToken = Utils.getOptimisticNextPageToken({
            page,
            pageSize,
            curPage: entries,
        });

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
                const {isLocked, entryId, scope, type} = entry;

                if (isLocked) {
                    return {
                        isLocked,
                        entryId,
                        scope,
                        type,
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
            throw new AppError('Validation error', {
                code: US_ERRORS.VALIDATION_ERROR,
                details: {validationErrors},
            });
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
