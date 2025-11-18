import {AppError} from '@gravity-ui/nodekit';
import {z} from 'zod';

import {zc} from '../../../../components/zod';
import {OrderBy, US_ERRORS} from '../../../../const';
import {Entry, EntryColumn} from '../../../../db/models/new/entry';
import {EntryScope} from '../../../../db/models/new/entry/types';
import Utils from '../../../../utils';
import {createPaginator} from '../../../../utils/cursor-pagination';
import {ServiceArgs} from '../../types';
import {getReplica} from '../../utils';
import {EntryWithPermissions} from '../types';
import {
    checkCollectionEntriesByPermission,
    checkFolderEntriesByPermission,
    checkWorkbookEntriesByPermission,
} from '../utils/check-entries-by-permission';

import {EntryRelation} from './entry-relation-presentation';
import {SearchDirection} from './types';

export type GetEntriesRelationsArgs = {
    entryIds: string[];
    searchDirection?: SearchDirection;
    includePermissionsInfo?: boolean;
    scope?: EntryScope;
    limit?: number;
    pageToken?: string;
};

export type EntryRelationWithPermissions = EntryWithPermissions<EntryRelation>;

export type GetEntriesRelationsResult = {
    relations: EntryRelationWithPermissions[];
    nextPageToken?: string;
};

const validationRules = {
    [`${Entry.tableName}.${EntryColumn.CreatedAt}`]: zc.stringSqlTimestampz(),
    [`${Entry.tableName}.${EntryColumn.EntryId}`]: z.string(),
} as const;

export const getEntriesRelations = async (
    {ctx, trx}: ServiceArgs,
    args: GetEntriesRelationsArgs,
): Promise<GetEntriesRelationsResult> => {
    const {tenantId, isPrivateRoute} = ctx.get('info');

    const {
        entryIds: rawEntryIds,
        scope,
        limit = 100,
        pageToken,
        searchDirection = SearchDirection.Children,
        includePermissionsInfo = false,
    } = args;

    ctx.log('GET_ENTRIES_RELATIONS_REQUEST', {
        entryIds: await Utils.macrotasksMap(rawEntryIds, (id) => Utils.encodeId(id)),
        searchDirection,
        scope,
        limit,
        pageToken,
        includePermissionsInfo,
    });

    const entryIds = Array.from(new Set(rawEntryIds));

    const entriesData = (await Entry.query(getReplica(trx))
        .select(EntryColumn.EntryId)
        .whereIn(EntryColumn.EntryId, entryIds)
        .where({
            [EntryColumn.IsDeleted]: false,
            ...(isPrivateRoute ? {} : {[EntryColumn.TenantId]: tenantId}),
        })
        .timeout(Entry.DEFAULT_QUERY_TIMEOUT)) as Array<{
        [EntryColumn.EntryId]: string;
    }>;

    if (entriesData.length !== entryIds.length) {
        const foundEntryIds = entriesData.map(({entryId}) => entryId);
        const missingEntryIds = entryIds.filter((id) => !foundEntryIds.includes(id));

        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
            details: {missingEntryIds},
        });
    }

    const paginator = createPaginator({
        sortField: `${Entry.tableName}.${EntryColumn.CreatedAt}`,
        tiebreakerField: `${Entry.tableName}.${EntryColumn.EntryId}`,
        direction: OrderBy.Asc,
        limit,
        pageToken,
        validationRules,
    });

    const relatedEntriesQuery = EntryRelation.getSelectQuery(getReplica(trx), {
        entryIds,
        searchDirection,
        scope,
    });

    const {result: relatedEntries, nextPageToken} = await paginator.execute(relatedEntriesQuery);

    // CHECK TENANT FOR RELATED ENTRIES ???

    const workbookEntries = relatedEntries.filter((entry) => entry.workbookId);
    const collectionEntries = relatedEntries.filter((entry) => entry.collectionId);
    const folderEntries = relatedEntries.filter(
        (entry) => !entry.workbookId && !entry.collectionId,
    );

    const workbookRelationsPromise =
        workbookEntries.length > 0
            ? checkWorkbookEntriesByPermission(
                  {ctx},
                  {entries: workbookEntries, includePermissionsInfo},
              )
            : Promise.resolve([]);

    const collectionRelationsPromise =
        collectionEntries.length > 0
            ? checkCollectionEntriesByPermission(
                  {ctx},
                  {entries: collectionEntries, includePermissionsInfo},
              )
            : [];

    const folderRelationsPromise =
        folderEntries.length > 0
            ? checkFolderEntriesByPermission(
                  {ctx},
                  {entries: folderEntries, includePermissionsInfo},
              )
            : [];

    const [workbookRelations, sharedEntriesRelations, folderRelations] = await Promise.all([
        workbookRelationsPromise,
        collectionRelationsPromise,
        folderRelationsPromise,
    ]);

    const processedRelations = [
        ...workbookRelations,
        ...sharedEntriesRelations,
        ...folderRelations,
    ];

    ctx.log('GET_ENTRIES_RELATIONS_SUCCESS', {count: processedRelations.length});

    return {
        relations: processedRelations,
        nextPageToken,
    };
};
