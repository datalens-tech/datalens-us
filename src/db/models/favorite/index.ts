import {Model} from '../..';
import Entry from '../entry';
import {Entry as EntryModel} from '../new/entry';
import {AppError} from '@gravity-ui/nodekit';
import * as MT from '../../../types/models';
import {DlsActions} from '../../../types/models';
import Utils from '../../../utils';
import {validateGetFavorites, validateAddFavorite, validateDeleteFavorite} from './scheme';
import {RETURN_FAVORITES_COLUMNS} from '../../../const';
import {registry} from '../../../registry';

import {getWorkbook} from '../../../services/new/workbook';

interface Favorite extends MT.FavoriteColumns {}
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
            dlContext,
        });

        const {DLS} = registry.common.classes.get();

        const {login} = requestedBy;

        const {isValid, validationErrors} = validateGetFavorites({
            tenantId,
            login,
            includePermissionsInfo,
            filters,
            orderBy,
            page,
            pageSize,
            scope,
        });

        if (!isValid) {
            throw new AppError('Validation error', {
                code: 'VALIDATION_ERROR',
                details: {validationErrors},
            });
        }

        let result: any[] = [];

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
                        'name',
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
            })
            .orderByRaw("CASE WHEN scope = 'folder' THEN 0 ELSE 1 END")
            .modify((builder) => {
                if (orderBy) {
                    switch (orderBy.field) {
                        case 'updatedAt':
                            builder.orderBy('entries.updatedAt', orderBy.direction);
                            break;
                        case 'createdAt':
                            builder.orderBy('entries.createdAt', orderBy.direction);
                            break;
                        case 'name':
                            builder.orderBy('sortName', orderBy.direction);
                            break;
                    }
                }
            })
            .page(page, pageSize)
            .timeout(Model.DEFAULT_QUERY_TIMEOUT);

        const nextPageToken = Utils.getNextPageToken(page, pageSize, entries.total);

        if (ctx.config.dlsEnabled) {
            result = await DLS.checkBulkPermission(
                {ctx},
                {
                    entities: entries.results,
                    action: MT.DlsActions.Read,
                    includePermissionsInfo,
                },
            );
        }

        // TODO: use originatePermissions
        if (!ctx.config.dlsEnabled && entries.results.length > 0) {
            result = entries.results.map((entry) => ({
                ...entry,
                ...(includePermissionsInfo && {
                    permissions: {
                        execute: true,
                        read: true,
                        edit: true,
                        admin: true,
                    },
                }),
            }));
        }

        ctx.log('GET_FAVORITES_SUCCESS');

        const data: MT.PaginationEntriesResponse = {
            nextPageToken,
            entries: result,
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

        const {DLS} = registry.common.classes.get();

        const {login} = requestedBy;

        const {isValid, validationErrors} = validateAddFavorite({tenantId, entryId, login});

        if (!isValid) {
            throw new AppError('Validation error', {
                code: 'VALIDATION_ERROR',
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
                code: 'VALIDATION_ERROR',
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
}

export default Favorite;
