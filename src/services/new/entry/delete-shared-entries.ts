import {AccessServicePermissionDeniedError, NotExistEntryError} from '../../../components/errors';
import {queryPrimary} from '../../../db';
import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {ALLOWED_SHARED_ENTRY_SCOPES, SharedEntryPermission} from '../../../entities/shared-entry';
import type {EntryColumns} from '../../../types/models';
import Utils, {makeUserId} from '../../../utils';
import {markEntriesAsDeleted} from '../../entry/crud';
import {makeCollectionEntriesWithParentsMap} from '../collection/utils/get-parents';
import {bulkCheckLock} from '../lock';
import {ServiceArgs} from '../types';

export interface DeleteSharedEntriesArgs {
    entryIds: string[];
    skipCheckPermissions?: boolean;
    detachDeletePermissions?: boolean;
}

export const deleteSharedEntries = async (
    {ctx, mainTrx}: ServiceArgs<'mainTrx'>,
    args: DeleteSharedEntriesArgs,
) => {
    const {entryIds, skipCheckPermissions = false, detachDeletePermissions = false} = args;

    ctx.log('DELETE_SHARED_ENTRIES_START', {
        entryIds: await Utils.macrotasksMap(entryIds, (id) => Utils.encodeId(id)),
    });

    const {accessServiceEnabled} = ctx.config;

    const {
        user: {userId},
        isPrivateRoute,
        tenantId,
    } = ctx.get('info');

    const {SharedEntry} = ctx.get('registry').common.classes.get();

    const entries = await queryPrimary(Entry, mainTrx)
        .select()
        .whereIn([EntryColumn.EntryId], entryIds)
        .where({[EntryColumn.IsDeleted]: false, [EntryColumn.TenantId]: tenantId})
        .whereNotNull(EntryColumn.CollectionId)
        .whereIn([EntryColumn.Scope], ALLOWED_SHARED_ENTRY_SCOPES)
        .timeout(Entry.DEFAULT_QUERY_TIMEOUT);

    const entriesWithParentsMap = await makeCollectionEntriesWithParentsMap(
        {ctx, trx: mainTrx},
        {
            models: entries,
        },
    );

    const itemsByEntryId = new Map<string, {model: Entry; parentIds: string[]}>();
    const items: {model: Entry; parentIds: string[]}[] = [];

    entriesWithParentsMap.forEach((parentIds, model) => {
        itemsByEntryId.set(model.entryId, {model, parentIds});
        items.push({model, parentIds});
    });

    if (accessServiceEnabled && !skipCheckPermissions && !isPrivateRoute) {
        const sharedEntries = await SharedEntry.bulkFetchAllPermissions(ctx, items);

        if (
            sharedEntries.some(
                (sharedEntry) => !sharedEntry.permissions?.[SharedEntryPermission.Delete],
            )
        ) {
            throw new AccessServicePermissionDeniedError();
        }
    }

    await bulkCheckLock({ctx}, {items: entries.map((entry) => ({entryId: entry.entryId}))});

    const deletedEntries = await markEntriesAsDeleted(
        {ctx},
        entries.map((entry) => ({
            entryId: entry.entryId,
            key: entry.key as string,
            displayKey: entry.displayKey as string,
            innerMeta: entry.innerMeta as EntryColumns['innerMeta'],
            updatedBy: makeUserId(userId),
            scope: entry.scope,
            type: entry.type,
            createdBy: entry.createdBy,
        })),
    );

    const deletePermissions = async () => {
        await Promise.all(
            deletedEntries.map(async (entry) => {
                const item = itemsByEntryId.get(entry.entryId);
                if (!item) {
                    throw new NotExistEntryError();
                }

                const sharedEntry = new SharedEntry({ctx, model: item.model});
                await sharedEntry.deletePermissions({
                    parentIds: item.parentIds,
                    skipCheckPermissions: true,
                });
            }),
        );
    };

    if (!detachDeletePermissions) {
        await deletePermissions();
    }

    ctx.log('DELETE_SHARED_ENTRIES_FINISH');

    return {
        entries: deletedEntries,
        deletePermissions: detachDeletePermissions ? deletePermissions : undefined,
    };
};
