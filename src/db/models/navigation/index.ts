import {raw} from 'objection';
import {Model} from '../..';
import Utils from '../../../utils';
import Revision from '../revision';
import Favorite from '../favorite';
import {AppError} from '@gravity-ui/nodekit';
import * as MT from '../../../types/models';
import {RETURN_NAVIGATION_COLUMNS, US_ERRORS} from '../../../const';
import {validateGetEntries, validateInterTenantGetEntries} from './scheme';
import {registry} from '../../../registry';

import {EntryPermissions} from '../../../services/new/entry/types';
import {getEntryPermissionsByWorkbook} from '../../../services/new/workbook/utils';

import {getWorkbooksListByIds} from '../../../services/new/workbook/get-workbooks-list-by-ids';
import {WorkbookInstance} from '../../../registry/common/entities/workbook/types';
import {whereBuilderInterTenantGetEntries} from './utils';

interface Navigation extends MT.EntryColumns {
    isLocked?: boolean;
    permissions?: MT.UsPermission;
}
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
            isPrivateRoute,
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

        const {DLS} = registry.common.classes.get();

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

        let result: any[] = [];

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
                        case 'updatedAt':
                            builder.orderBy('revisions.updatedAt', orderBy.direction);
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

        const workbookEntries: Navigation[] = [];
        const entryWithoutWorkbook: Navigation[] = [];

        entries.results.forEach((entry: Navigation) => {
            if (entry.workbookId) {
                workbookEntries.push(entry);
            } else {
                entryWithoutWorkbook.push(entry);
            }
        });

        const nextPageToken = Utils.getNextPageToken(page, pageSize, entries.total);

        if (entryWithoutWorkbook.length > 0) {
            if (!isPrivateRoute && ctx.config.dlsEnabled) {
                result = await DLS.checkBulkPermission(
                    {ctx},
                    {
                        entities: entryWithoutWorkbook,
                        action: MT.DlsActions.Read,
                        includePermissionsInfo,
                    },
                );
            } else {
                result = entryWithoutWorkbook.map((entry) => ({
                    ...entry,
                    isLocked: false,
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
        }

        if (workbookEntries.length > 0) {
            if (!isPrivateRoute && ctx.config.accessServiceEnabled) {
                const workbookList = await getWorkbooksListByIds(
                    {ctx},
                    {
                        workbookIds: workbookEntries.map((entry) => entry.workbookId) as string[],
                        includePermissionsInfo,
                    },
                );

                const entryPermissionsMap = new Map<string, EntryPermissions>();
                const workbooksMap = new Map<string, WorkbookInstance>();

                workbookList.forEach((workbook) => {
                    workbooksMap.set(workbook.model.workbookId, workbook);
                });

                workbookEntries.forEach((entry) => {
                    if (entry?.workbookId && workbooksMap.has(entry.workbookId)) {
                        const workbook = workbooksMap.get(entry.workbookId);

                        if (workbook && includePermissionsInfo) {
                            const permissions = getEntryPermissionsByWorkbook({
                                ctx,
                                workbook,
                                scope: entry.scope,
                            });
                            entryPermissionsMap.set(entry.entryId, permissions);
                        }

                        let isLocked = false;

                        if (entryPermissionsMap.has(entry.entryId)) {
                            const isReadPermission = entryPermissionsMap.get(entry.entryId)?.read;

                            if (!isReadPermission) {
                                isLocked = true;
                            }
                        }

                        result.push({
                            ...entry,
                            permissions: includePermissionsInfo
                                ? entryPermissionsMap.get(entry.entryId)
                                : undefined,
                            isLocked,
                        });
                    }
                });
            } else {
                result = [
                    ...result,
                    ...workbookEntries.map((entry) => ({
                        ...entry,
                        isLocked: false,
                        ...(includePermissionsInfo && {
                            permissions: {
                                execute: true,
                                read: true,
                                edit: true,
                                admin: true,
                            },
                        }),
                    })),
                ];
            }
        }

        const mapResult = new Map<string, Navigation>();

        result.forEach((entry) => {
            mapResult.set(entry.entryId, entry);
        });

        const orderedResult: Navigation[] = [];

        entries.results.forEach((entry) => {
            const model = mapResult.get(entry.entryId);

            if (model) {
                orderedResult.push(model);
            }
        });

        result = Navigation.processEntries(orderedResult);

        if (excludeLocked) {
            result = Navigation.filterEntriesByIsLocked(result);
        }

        ctx.log('GET_ENTRIES_REQUEST_SUCCESS');

        const data: MT.PaginationEntriesResponse = {
            nextPageToken,
            entries: result,
        };

        return data;
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
            .page(page, pageSize)
            .orderBy('revisions.updatedAt', orderBy)
            .timeout(Model.DEFAULT_QUERY_TIMEOUT);

        ctx.log('GET_ENTRIES_IN_TENANTS_SUCCESS');

        const data: MT.PaginationEntriesResponse = {
            nextPageToken: Utils.getNextPageToken(page, pageSize, entries.total),
            entries: entries.results,
        };

        return data;
    }

    private static processEntries(entries: MT.EntryType[] = []): MT.EntryType[] {
        return entries.map((entry) => {
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
    }

    private static filterEntriesByIsLocked(entries: Navigation[] = []): Navigation[] {
        return entries.filter(({isLocked}) => !isLocked);
    }
}

export default Navigation;
