import {AppContext} from '@gravity-ui/nodekit';
import _ from 'lodash';

import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {EntryScope} from '../../../db/models/new/entry/types';
import {
    JoinedEntryRevision,
    JoinedEntryRevisionColumns,
} from '../../../db/presentations/joined-entry-revision';
import {UsPermissions} from '../../../types/models';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

import {
    checkCollectionEntriesByPermission,
    checkFolderEntriesByPermission,
    checkWorkbookEntriesByPermission,
} from './utils/check-entries-by-permission';

const checkWorkbookEntriesPermissions = async ({
    ctx,
    entries,
}: {
    ctx: AppContext;
    entries: JoinedEntryRevisionColumns[];
}): Promise<{
    permittedWorkbookEntries: JoinedEntryRevisionColumns[];
    accessDeniedWorkbookEntryIds: string[];
}> => {
    const {accessServiceEnabled} = ctx.config;

    if (entries.length === 0 || !accessServiceEnabled) {
        return {permittedWorkbookEntries: entries, accessDeniedWorkbookEntryIds: []};
    }

    const permittedWorkbookEntries: JoinedEntryRevisionColumns[] = [];
    const accessDeniedWorkbookEntryIds: string[] = [];

    const checkedEntries = await checkWorkbookEntriesByPermission(
        {ctx},
        {entries, permission: UsPermissions.Execute},
    );

    checkedEntries.forEach((entry) => {
        if (entry.isLocked) {
            accessDeniedWorkbookEntryIds.push(entry.entryId);
        } else {
            permittedWorkbookEntries.push(entry);
        }
    });

    return {permittedWorkbookEntries, accessDeniedWorkbookEntryIds};
};

const checkSharedEntriesPermissions = async ({
    ctx,
    entries,
}: {
    ctx: AppContext;
    entries: JoinedEntryRevisionColumns[];
}): Promise<{
    permittedSharedEntries: JoinedEntryRevisionColumns[];
    accessDeniedSharedEntryIds: string[];
}> => {
    const {accessServiceEnabled} = ctx.config;

    if (entries.length === 0 || !accessServiceEnabled) {
        return {permittedSharedEntries: entries, accessDeniedSharedEntryIds: []};
    }

    const checkedEntries = await checkCollectionEntriesByPermission({ctx}, {entries});

    const permittedSharedEntries: JoinedEntryRevisionColumns[] = [];
    const accessDeniedSharedEntryIds: string[] = [];

    checkedEntries.forEach((entry) => {
        if (entry.isLocked) {
            accessDeniedSharedEntryIds.push(entry.entryId);
        } else {
            permittedSharedEntries.push(entry);
        }
    });

    return {permittedSharedEntries, accessDeniedSharedEntryIds};
};

const checkFolderEntriesPermissions = async ({
    ctx,
    entries,
}: {
    ctx: AppContext;
    entries: JoinedEntryRevisionColumns[];
}): Promise<{
    permittedFolderEntries: JoinedEntryRevisionColumns[];
    accessDeniedFolderEntryIds: string[];
}> => {
    const {dlsEnabled} = ctx.config;

    if (entries.length === 0 || !dlsEnabled) {
        return {
            permittedFolderEntries: entries,
            accessDeniedFolderEntryIds: [],
        };
    }

    const checkedEntries = await checkFolderEntriesByPermission({ctx}, {entries});

    const permittedFolderEntries: JoinedEntryRevisionColumns[] = [];
    const accessDeniedFolderEntryIds: string[] = [];

    checkedEntries.forEach((entry) => {
        if (entry.isLocked) {
            accessDeniedFolderEntryIds.push(entry.entryId);
        } else {
            permittedFolderEntries.push(entry);
        }
    });

    return {
        permittedFolderEntries,
        accessDeniedFolderEntryIds,
    };
};

export type GetJoinedEntriesRevisionsByIdsArgs = {
    entryIds: string[];
    scope?: EntryScope;
    type?: string;
};

export type GetJoinedEntriesRevisionsByIdsResult = {
    entries: Record<string, JoinedEntryRevisionColumns>;
    accessDeniedEntryIds: Set<string>;
};

export const getJoinedEntriesRevisionsByIds = async (
    {ctx, trx}: ServiceArgs,
    args: GetJoinedEntriesRevisionsByIdsArgs,
): Promise<GetJoinedEntriesRevisionsByIdsResult> => {
    const {entryIds, scope, type} = args;

    ctx.log('GET_JOINED_ENTRIES_REVISIONS_BY_IDS_REQUEST', {
        entryIds: await Utils.macrotasksMap(entryIds, (entryId) => Utils.encodeId(entryId)),
        scope,
        type,
    });

    const {tenantId} = ctx.get('info');

    const joinedEntriesRevisions = await JoinedEntryRevision.find({
        where: (builder) => {
            builder.whereIn(`${Entry.tableName}.${EntryColumn.EntryId}`, entryIds).andWhere({
                [EntryColumn.TenantId]: tenantId,
                [EntryColumn.IsDeleted]: false,
            });

            if (scope) {
                builder.andWhere({[`${Entry.tableName}.${EntryColumn.Scope}`]: scope});
            }

            if (type) {
                builder.andWhere({[`${Entry.tableName}.${EntryColumn.Type}`]: type});
            }
        },
        trx: getReplica(trx),
    });

    const workbookEntries: JoinedEntryRevisionColumns[] = [];
    const folderEntries: JoinedEntryRevisionColumns[] = [];
    const sharedEntries: JoinedEntryRevisionColumns[] = [];

    joinedEntriesRevisions.forEach((joinedEntryRevision) => {
        if (joinedEntryRevision.workbookId) {
            workbookEntries.push(joinedEntryRevision);
        } else if (joinedEntryRevision.collectionId) {
            sharedEntries.push(joinedEntryRevision);
        } else {
            folderEntries.push(joinedEntryRevision);
        }
    });

    const [
        {permittedWorkbookEntries, accessDeniedWorkbookEntryIds},
        {permittedFolderEntries, accessDeniedFolderEntryIds},
        {permittedSharedEntries, accessDeniedSharedEntryIds},
    ] = await Promise.all([
        checkWorkbookEntriesPermissions({ctx, entries: workbookEntries}),
        checkFolderEntriesPermissions({ctx, entries: folderEntries}),
        checkSharedEntriesPermissions({ctx, entries: sharedEntries}),
    ]);

    const entriesMap = _.keyBy<JoinedEntryRevisionColumns>(
        [...permittedWorkbookEntries, ...permittedFolderEntries, ...permittedSharedEntries],
        (item) => item.entryId,
    );

    ctx.log('GET_JOINED_ENTRIES_REVISIONS_BY_IDS_SUCCESS');

    return {
        entries: entriesMap,
        accessDeniedEntryIds: new Set([
            ...accessDeniedWorkbookEntryIds,
            ...accessDeniedFolderEntryIds,
            ...accessDeniedSharedEntryIds,
        ]),
    };
};
