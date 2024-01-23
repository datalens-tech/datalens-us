import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {DEFAULT_PAGE, DEFAULT_PAGE_SIZE} from '../../../const';
import {EntryScope} from '../../../db/models/new/entry/types';
import Utils, {logInfo} from '../../../utils';
import {UsPermission} from '../../../types/models';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';
import {getWorkbook} from './get-workbook';
import {getEntryPermissionsByWorkbook} from './utils';
import {Feature, isEnabledFeature} from '../../../components/features';

import {JoinedEntryRevisionFavorite} from '../../../db/presentations';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['workbookId'],
    properties: {
        workbookId: {
            type: 'string',
        },
        page: {
            type: 'number',
            minimum: 0,
        },
        pageSize: {
            type: 'number',
            minimum: 1,
            maximum: 200,
        },
        includePermissionsInfo: {
            type: 'boolean',
        },
        createdBy: {
            type: 'string',
        },
        filters: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                },
            },
        },
        orderBy: {
            type: 'object',
            required: ['field', 'direction'],
            properties: {
                field: {
                    type: 'string',
                    enum: ['name', 'updatedAt', 'createdAt'],
                },
                direction: {
                    type: 'string',
                    enum: ['asc', 'desc'],
                },
            },
        },
        scope: {
            type: ['array', 'string'],
        },
    },
});

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
        field: 'name' | 'updatedAt' | 'createdAt';
        direction: 'asc' | 'desc';
    };
    scope?: EntryScope | EntryScope[];
}

export const getWorkbookContent = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
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

    logInfo(ctx, 'GET_WORKBOOK_CONTENT_START', {
        workbookId: Utils.encodeId(workbookId),
        includePermissionsInfo,
        page,
        pageSize,
        createdBy,
        filters,
        orderBy,
        scope,
    });

    if (!skipValidation) {
        validateArgs(args);
    }

    const targetTrx = getReplica(trx);

    const {user, tenantId, projectId} = ctx.get('info');

    const workbook = await getWorkbook(
        {ctx, trx, skipValidation: true, skipCheckPermissions},
        {
            workbookId,
            includePermissionsInfo: true,
        },
    );

    const entriesPage = await JoinedEntryRevisionFavorite.findPage({
        where: (builder) => {
            builder.where({
                tenantId,
                projectId,
                workbookId: workbookId,
                isDeleted: false,
            });

            if (isEnabledFeature(ctx, Feature.UseLimitedView) && !workbook.permissions?.view) {
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
        },
        trx: targetTrx,
        userLogin: user.login,
        page,
        pageSize,
    });

    const nextPageToken = Utils.getNextPageToken(page, pageSize, entriesPage.total);

    const entries = entriesPage.results.map((entry) => {
        let permissions: Optional<UsPermission>;

        if (includePermissionsInfo) {
            permissions = getEntryPermissionsByWorkbook({
                ctx,
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
