import {AppError} from '@gravity-ui/nodekit';

import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {ALLOWED_ENTRIES_SCOPE, US_ERRORS} from '../../../const';
import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {EntryScope} from '../../../db/models/new/entry/types';
import {SharedEntryPermission} from '../../../entities/shared-entry';
import {UsPermissions} from '../../../types/models';
import Utils from '../../../utils';
import {EntryWithPermissions} from '../../new/entry/types';
import {checkSharedEntryPermission} from '../../new/entry/utils/check-collection-entry-permission/check-permission';
import {
    checkCollectionEntriesByPermission,
    checkFolderEntriesByPermission,
    checkWorkbookEntriesByPermission,
} from '../../new/entry/utils/check-entries-by-permission';
import {ServiceArgs} from '../../new/types';
import {getReplica} from '../../new/utils';
import {getWorkbook} from '../../new/workbook/get-workbook';
import {getEntryPermissionsByWorkbook} from '../../new/workbook/utils';

import {GetRelatedEntriesResult, RelationDirection, getRelatedEntries} from './get-related-entries';

export type GetEntryRelationsArgs = {
    entryId: string;
    direction?: RelationDirection;
    includePermissionsInfo?: boolean;
    scope?: EntryScope;
    page?: number;
    pageSize?: number;
};

type RelationItem = EntryWithPermissions<GetRelatedEntriesResult>;

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['entryId'],
    properties: {
        entryId: {
            type: 'string',
        },
        direction: {
            type: 'string',
            enum: [RelationDirection.Parent, RelationDirection.Child],
        },
        includePermissionsInfo: {
            type: 'boolean',
        },
        scope: {
            type: 'string',
            enum: ALLOWED_ENTRIES_SCOPE,
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
    },
});

export async function getEntryRelations(
    {ctx, trx, skipValidation = false}: ServiceArgs,
    args: GetEntryRelationsArgs,
) {
    const {tenantId, isPrivateRoute} = ctx.get('info');

    const {
        entryId,
        scope,
        page,
        pageSize,
        direction = RelationDirection.Parent,
        includePermissionsInfo = false,
    } = args;

    ctx.log('GET_ENTRY_RELATIONS_REQUEST', {
        entryId: Utils.encodeId(entryId),
        direction,
        scope,
        page,
        pageSize,
        includePermissionsInfo,
    });

    if (!skipValidation) {
        validateArgs(args);
    }

    const entry = await Entry.query(getReplica(trx))
        .where({
            [EntryColumn.EntryId]: entryId,
            [EntryColumn.IsDeleted]: false,
            ...(isPrivateRoute ? {} : {[EntryColumn.TenantId]: tenantId}),
        })
        .first()
        .timeout(Entry.DEFAULT_QUERY_TIMEOUT);

    if (!entry) {
        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
    }

    const relatedEntries = await getRelatedEntries(
        {ctx, trx: getReplica(trx)},
        {
            entryIds: [entryId],
            direction,
            scope,
            page,
            pageSize,
        },
    );

    const isPagination = typeof page !== 'undefined' && typeof pageSize !== 'undefined';

    let nextPageToken;

    if (isPagination) {
        nextPageToken = Utils.getOptimisticNextPageToken({
            page: page,
            pageSize: pageSize,
            curPage: relatedEntries,
        });
    }

    let relations: RelationItem[] = relatedEntries.filter(
        (item) => item.tenantId === entry.tenantId,
    );

    if (entry.workbookId) {
        const workbook = await getWorkbook(
            {
                ctx,
                trx: getReplica(trx),
            },
            {workbookId: entry.workbookId, includePermissionsInfo},
        );

        let workbookRelations: RelationItem[] = relations
            .filter((item) => item.workbookId === entry.workbookId)
            .map((item) => ({...item, isLocked: false}));

        if (includePermissionsInfo) {
            workbookRelations = workbookRelations.map((item) => {
                return {
                    ...item,
                    permissions: getEntryPermissionsByWorkbook({
                        workbook,
                        scope: item.scope,
                    }),
                };
            });
        }

        const sharedEntriesRelations = await checkCollectionEntriesByPermission(
            {ctx},
            {
                entries: relations.filter((item) => item.collectionId === entry.collectionId),
                includePermissionsInfo,
            },
        );

        relations = [...workbookRelations, ...sharedEntriesRelations];
    } else if (entry.collectionId) {
        await checkSharedEntryPermission({ctx}, {entry, permission: SharedEntryPermission.View});

        const workbookRelations = await checkWorkbookEntriesByPermission(
            {ctx},
            {
                entries: relations.filter((item) => item.workbookId === entry.workbookId),
                includePermissionsInfo,
                permission: UsPermissions.Execute,
            },
        );

        const sharedEntriesRelations = await checkCollectionEntriesByPermission(
            {ctx},
            {
                entries: relations.filter((item) => item.collectionId === entry.collectionId),
                includePermissionsInfo,
            },
        );
        relations = [...workbookRelations, ...sharedEntriesRelations];
    } else {
        relations = await checkFolderEntriesByPermission(
            {ctx},
            {entries: relations, includePermissionsInfo},
        );
    }

    ctx.log('GET_ENTRY_RELATIONS_SUCCESS', {count: relations.length});

    return {
        relations,
        nextPageToken,
    };
}
