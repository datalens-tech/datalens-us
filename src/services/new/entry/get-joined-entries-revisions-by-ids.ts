import {AppContext} from '@gravity-ui/nodekit';
import _ from 'lodash';

import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {EntryScope} from '../../../db/models/new/entry/types';
import {
    JoinedEntryRevision,
    JoinedEntryRevisionColumns,
} from '../../../db/presentations/joined-entry-revision';
import {WorkbookPermission} from '../../../entities/workbook';
import {checkWorkbookPermissionById} from '../../../services/new/workbook/utils/check-workbook-permission';
import {DlsActions} from '../../../types/models';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

const checkWorkbookEntriesPermissions = async ({
    ctx,
    workbookIds,
    entries,
}: {
    ctx: AppContext;
    workbookIds: string[];
    entries: JoinedEntryRevisionColumns[];
}): Promise<{
    permittedWorkbookEntries: JoinedEntryRevisionColumns[];
    accessDeniedWorkbookEntryIds: string[];
}> => {
    const {accessServiceEnabled} = ctx.config;

    if (workbookIds.length === 0 || !accessServiceEnabled) {
        return {permittedWorkbookEntries: entries, accessDeniedWorkbookEntryIds: []};
    }

    const workbookPermissionMapping = new Map(
        await Promise.all(
            workbookIds.map(async (workbookId): Promise<[string, boolean]> => {
                try {
                    await checkWorkbookPermissionById({
                        ctx,
                        workbookId,
                        permission: WorkbookPermission.LimitedView,
                    });
                    return [workbookId, true];
                } catch {
                    return [workbookId, false];
                }
            }),
        ),
    );

    const permittedWorkbookEntries: JoinedEntryRevisionColumns[] = [];
    const accessDeniedWorkbookEntryIds: string[] = [];

    entries.forEach((entry) => {
        const {workbookId} = entry;

        if (workbookId && workbookPermissionMapping.get(workbookId)) {
            permittedWorkbookEntries.push(entry);
        } else {
            accessDeniedWorkbookEntryIds.push(entry.entryId);
        }
    });

    return {permittedWorkbookEntries, accessDeniedWorkbookEntryIds};
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

    const registry = ctx.get('registry');
    const {DLS} = registry.common.classes.get();

    const entriesWithPermissions = await DLS.checkBulkPermission(
        {ctx},
        {
            entities: entries,
            action: DlsActions.Read,
        },
    );

    const permittedFolderEntries: JoinedEntryRevisionColumns[] = [];
    const accessDeniedFolderEntryIds: string[] = [];

    entriesWithPermissions.forEach((entry) => {
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

    const workbookIds = new Set<string>();
    const workbookEntries: JoinedEntryRevisionColumns[] = [];
    const folderEntries: JoinedEntryRevisionColumns[] = [];

    joinedEntriesRevisions.forEach((joinedEntryRevision) => {
        const {workbookId} = joinedEntryRevision;

        if (workbookId) {
            workbookIds.add(workbookId);

            workbookEntries.push(joinedEntryRevision);
        } else {
            folderEntries.push(joinedEntryRevision);
        }
    });

    const [
        {permittedWorkbookEntries, accessDeniedWorkbookEntryIds},
        {permittedFolderEntries, accessDeniedFolderEntryIds},
    ] = await Promise.all([
        checkWorkbookEntriesPermissions({
            ctx,
            workbookIds: [...workbookIds],
            entries: workbookEntries,
        }),
        checkFolderEntriesPermissions({ctx, entries: folderEntries}),
    ]);

    const entriesMap = _.keyBy<JoinedEntryRevisionColumns>(
        [...permittedWorkbookEntries, ...permittedFolderEntries],
        (item) => item.entryId,
    );

    ctx.log('GET_JOINED_ENTRIES_REVISIONS_BY_IDS_SUCCESS');

    return {
        entries: entriesMap,
        accessDeniedEntryIds: new Set([
            ...accessDeniedWorkbookEntryIds,
            ...accessDeniedFolderEntryIds,
        ]),
    };
};
