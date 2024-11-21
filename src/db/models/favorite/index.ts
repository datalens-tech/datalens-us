import {raw} from 'objection';
import {Model} from '../..';
import Entry from '../entry';
import {Entry as EntryModel} from '../new/entry';
import {AppError} from '@gravity-ui/nodekit';
import * as MT from '../../../types/models';
import {DlsActions} from '../../../types/models';
import Utils from '../../../utils';
import {
    validateGetFavorites,
    validateAddFavorite,
    validateDeleteFavorite,
    validateRenameFavorite,
} from './scheme';
import {RETURN_FAVORITES_COLUMNS, US_ERRORS} from '../../../const';

import {getWorkbook} from '../../../services/new/workbook';
import {filterEntriesByPermission} from '../../../services/new/entry/utils';

interface FavoriteFields extends MT.FavoriteColumns {
    isLocked?: boolean;
    permissions?: MT.UsPermission;
}
interface Favorite extends FavoriteFields {}
class Favorite extends Model {
    static get tableName() {
        return 'favorites';
    }

    static get idColumn() {
        return ['entryId', 'login'];
    }

    static get relationMappings() {
        return {
            entries: {
                relation: Model.HasManyRelation,
                modelClass: Entry,
                join: {
                    from: 'favorites.entryId',
                    to: 'entries.entryId',
                },
            },
        };
    }

    static async get({
        tenantId,
        requestedBy,
        ctx,
        filters,
        orderBy,
        page = 0,
        pageSize = 100,
        scope,
        includePermissionsInfo,
        ignoreWorkbookEntries,
        dlContext,
    }: MT.GetFavoriteConfig) {
        ctx.log('GET_FAVORITES_REQUEST', {
            tenantId,
            requestedBy,
            filters,
            orderBy,
            page,
            pageSize,
            scope,
            includePermissionsInfo,
            ignoreWorkbookEntries,
            dlContext,
        });

        const {login} = requestedBy;

        const {isValid, validationErrors} = validateGetFavorites({
            tenantId,
            login,
            includePermissionsInfo,
            ignoreWorkbookEntries,
            filters,
            orderBy,
            page,
            pageSize,
            scope,
        });

        if (!isValid) {
            throw new AppError('Validation error', {
                code: US_ERRORS.VALIDATION_ERROR,
                details: {validationErrors},
            });
        }

        const entries = await Favorite.query(this.replica)
            .select(RETURN_FAVORITES_COLUMNS)
            .join('entries', 'favorites.entryId', 'entries.entryId')
            .leftJoin('workbooks', 'entries.workbookId', 'workbooks.workbookId')
            .where({
                'favorites.tenantId': tenantId,
                'favorites.login': login,
                'entries.isDeleted': false,
            })
            .where((builder) => {
                if (filters && filters.name) {
                    builder.where(
                        raw('coalesce(favorites.alias, entries.name)'),
                        'like',
                        `%${Utils.escapeStringForLike(filters.name.toLowerCase())}%`,
                    );
                }
                if (scope) {
                    const scopes = Array.isArray(scope)
                        ? scope
                        : scope.replace(/\s/g, '').split(',');

                    builder.whereIn('scope', ['folder', ...scopes]);
                }

                if (ignoreWorkbookEntries) {
                    builder.where('entries.workbookId', null);
                }
            })
            .orderByRaw("CASE WHEN scope = 'folder' THEN 0 ELSE 1 END")
            .modify((builder) => {
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
            })
            .limit(pageSize)
            .offset(pageSize * page)
            .timeout(Model.DEFAULT_QUERY_TIMEOUT);

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

        const data: MT.PaginationEntriesResponse = {
            nextPageToken,
            entries: entriesWithPermissionsOnly,
        };

        return data;
    }

    static async add({tenantId, entryId, requestedBy, ctx, dlContext}: MT.AddFavoriteConfig) {
        ctx.log('ADD_TO_FAVORITES_REQUEST', {
            tenantId,
            entryId,
            requestedBy,
            dlContext,
        });

        const registry = ctx.get('registry');
        const {DLS} = registry.common.classes.get();

        const {login} = requestedBy;

        const {isValid, validationErrors} = validateAddFavorite({tenantId, entryId, login});

        if (!isValid) {
            throw new AppError('Validation error', {
                code: US_ERRORS.VALIDATION_ERROR,
                details: {validationErrors},
            });
        }

        const entry = await EntryModel.query(this.replica)
            .select()
            .where({
                entryId,
                tenantId,
                isDeleted: false,
            })
            .first()
            .timeout(Model.DEFAULT_QUERY_TIMEOUT);

        if (!entry) {
            throw new AppError('NOT_EXIST_ENTRY', {
                code: 'NOT_EXIST_ENTRY',
            });
        }

        if (entry.workbookId) {
            await getWorkbook({ctx}, {workbookId: entry.workbookId});
        } else if (ctx.config.dlsEnabled) {
            await DLS.checkPermission(
                {ctx},
                {
                    entryId,
                    action: DlsActions.Read,
                },
            );
        }

        const result = await Favorite.query(this.primary)
            .insert({tenantId, entryId, login})
            .returning('*')
            .timeout(Model.DEFAULT_QUERY_TIMEOUT);

        ctx.log('ADD_TO_FAVORITES_SUCCESS');

        return result;
    }

    static async delete({tenantId, entryId, requestedBy, ctx, dlContext}: MT.DeleteFavoriteConfig) {
        ctx.log('DELETE_FROM_FAVORITES_REQUEST', {
            entryId,
            tenantId,
            requestedBy,
            dlContext,
        });

        const {login} = requestedBy;

        const {isValid, validationErrors} = validateDeleteFavorite({entryId, login});

        if (!isValid) {
            throw new AppError('Validation error', {
                code: US_ERRORS.VALIDATION_ERROR,
                details: {validationErrors},
            });
        }

        const result = await Favorite.query(this.primary)
            .delete()
            .where({entryId, tenantId, login})
            .returning('*')
            .timeout(Model.DEFAULT_QUERY_TIMEOUT);

        ctx.log('DELETE_FROM_FAVORITES_SUCCESS');

        return result;
    }

    static async rename({
        tenantId,
        entryId,
        name,
        requestedBy,
        ctx,
        dlContext,
    }: MT.RenameFavoriteConfig) {
        ctx.log('RENAME_FAVORITE_REQUEST', {
            tenantId,
            entryId,
            name,
            requestedBy,
            dlContext,
        });

        validateRenameFavorite({entryId, name});

        const {login} = requestedBy;

        const displayAlias = name ? name : null;
        const alias = displayAlias ? displayAlias.toLowerCase() : null;

        const result = await Favorite.query(this.primary)
            .update({alias, displayAlias})
            .where({entryId, tenantId, login})
            .returning('*')
            .first()
            .timeout(Model.DEFAULT_QUERY_TIMEOUT);

        ctx.log('RENAME_FAVORITE_SUCCESS');

        return result;
    }
}

export default Favorite;
