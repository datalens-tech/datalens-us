import {DEFAULT_PAGE, DEFAULT_PAGE_SIZE} from '../../../const';
import {EntryScope} from '../../../db/models/new/entry/types';
import {JoinedEntryRevisionFavorite} from '../../../db/presentations';
import {UsPermission} from '../../../types/models';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

import {getWorkbook} from './get-workbook';
import {getEntryPermissionsByWorkbook} from './utils';

export interface GetWorkbookContentArgs {
    workbookId: string;
    includePermissionsInfo?: boolean;
    page?: number;
    pageSize?: number;
    createdBy?: string;
    filters?: {
        name?: string;
    };
    orderBy?: {
        field: 'name' | 'createdAt';
        direction: 'asc' | 'desc';
    };
    scope?: EntryScope | EntryScope[];
}

export const getWorkbookContent = async (
    {ctx, trx, skipCheckPermissions = false}: ServiceArgs,
    args: GetWorkbookContentArgs,
) => {
    const {
        workbookId,
        includePermissionsInfo = false,
        page = DEFAULT_PAGE,
        pageSize = DEFAULT_PAGE_SIZE,
        createdBy,
        filters,
        orderBy,
        scope,
    } = args;

    ctx.log('GET_WORKBOOK_CONTENT_START', {
        workbookId: Utils.encodeId(workbookId),
        includePermissionsInfo,
        page,
        pageSize,
        createdBy,
        filters,
        orderBy,
        scope,
    });

    const targetTrx = getReplica(trx);

    const {user, tenantId, isPrivateRoute} = ctx.get('info');

    const workbook = await getWorkbook(
        {ctx, trx, skipValidation: true, skipCheckPermissions, skipLicenseCheck: true},
        {
            workbookId,
            includePermissionsInfo: true,
        },
    );

    const entriesPage = await JoinedEntryRevisionFavorite.findPage({
        where: (builder) => {
            builder.where({
                ...(isPrivateRoute
                    ? {}
                    : {
                          'entries.tenantId': tenantId,
                      }),
                workbookId: workbookId,
                isDeleted: false,
            });

            if (!workbook.permissions?.view) {
                builder.whereNotIn('scope', ['dataset', 'connection']);
            }
            if (createdBy) {
                builder.where('entries.createdBy', createdBy);
            }
            if (filters?.name) {
                builder.where(
                    'name',
                    'like',
                    `%${Utils.escapeStringForLike(filters.name.toLowerCase())}%`,
                );
            }
            if (scope) {
                builder.whereIn('scope', Array.isArray(scope) ? scope : [scope]);
            }
        },
        modify: (builder) => {
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
        },
        trx: targetTrx,
        userLogin: user.login,
        page,
        pageSize,
    });

    const nextPageToken = Utils.getOptimisticNextPageToken({
        page,
        pageSize,
        curPage: entriesPage,
    });

    const entries = entriesPage.map((entry) => {
        let permissions: Optional<UsPermission>;

        if (includePermissionsInfo) {
            permissions = getEntryPermissionsByWorkbook({
                workbook,
                scope: entry.scope,
            });
        }

        return {
            ...entry,
            permissions,
            isLocked: false,
        };
    });

    ctx.log('GET_WORKBOOK_CONTENT_FINISH');

    return {
        entries,
        nextPageToken,
    };
};
