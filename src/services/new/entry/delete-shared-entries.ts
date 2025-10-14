import {AppError} from '@gravity-ui/nodekit';

import {US_ERRORS} from '../../../const';
import Lock from '../../../db/models/lock';
import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {SharedEntryPermission} from '../../../entities/shared-entry';
import {SharedEntryInstance} from '../../../registry/plugins/common/entities/shared-entry/types';
import Utils, {makeUserId} from '../../../utils';
import {markEntriesAsDeleted} from '../../entry/crud';
import {makeSharedEntriesWithParentsMap} from '../collection/utils/get-parents';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';

export interface DeleteSharedEntriesArgs {
    entryIds: string[];
    skipCheckPermissions?: boolean;
    skipDeletePermissions?: boolean;
}

export const deleteSharedEntries = async (
    {ctx, trx}: ServiceArgs,
    args: DeleteSharedEntriesArgs,
) => {
    const {entryIds, skipCheckPermissions = false, skipDeletePermissions = false} = args;

    ctx.log('DELETE_SHARED_ENTRIES_START', {
        entryIds: await Utils.macrotasksMap(entryIds, (id) => Utils.encodeId(id)),
    });

    const {accessServiceEnabled} = ctx.config;

    const {
        user: {userId},
        isPrivateRoute,
        tenantId,
    } = ctx.get('info');
    const registry = ctx.get('registry');
    const {SharedEntry} = registry.common.classes.get();

    const entries = await Entry.query(getPrimary(trx))
        .select()
        .whereIn([EntryColumn.EntryId], entryIds)
        .where({[EntryColumn.IsDeleted]: false, [EntryColumn.TenantId]: tenantId})
        .whereNotNull(EntryColumn.CollectionId)
        .timeout(Entry.DEFAULT_QUERY_TIMEOUT);

    const sharedEntriesWithParentsMap = await makeSharedEntriesWithParentsMap(
        {ctx, trx: getPrimary(trx)},
        {
            models: entries,
        },
    );

    const sharedEntriesIdsMap = new Map<
        string,
        {entry: SharedEntryInstance; parentIds: string[]}
    >();
    const sharedEntriesForBulk: {model: Entry; parentIds: string[]}[] = [];

    sharedEntriesWithParentsMap.forEach((parentIds, sharedEntry) => {
        sharedEntriesIdsMap.set(sharedEntry.model.entryId, {entry: sharedEntry, parentIds});
        sharedEntriesForBulk.push({model: sharedEntry.model, parentIds});
    });

    if (accessServiceEnabled && !skipCheckPermissions && !isPrivateRoute) {
        const sharedEntries = await SharedEntry.bulkFetchAllPermissions(ctx, sharedEntriesForBulk);
        if (
            sharedEntries.some(
                (sharedEntry) => !sharedEntry.permissions?.[SharedEntryPermission.Delete],
            )
        ) {
            throw new AppError(US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED, {
                code: US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED,
            });
        }
    }

    await Lock.bulkCheckLock(
        entries.map((entry) => ({entryId: entry.entryId})),
        ctx,
    );

    const data = entries.map((entry) => ({
        entryId: entry.entryId,
        newKey: entry.key as string,
        newDisplayKey: entry.displayKey as string,
        updatedBy: makeUserId(userId),
        newInnerMeta: {
            ...entry.innerMeta,
            oldKey: entry.key as string,
            oldDisplayKey: entry.displayKey as string,
        },
        scope: entry.scope,
        type: entry.type,
        createdBy: entry.createdBy,
    }));

    const deletedEntries = await markEntriesAsDeleted({ctx}, data);

    const deletePermissions = async () => {
        await Promise.all(
            deletedEntries.map(async (entry) => {
                const {entryId} = entry;

                const sharedEntryData = sharedEntriesIdsMap.get(entryId);
                if (!sharedEntryData) {
                    throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
                        code: US_ERRORS.NOT_EXIST_ENTRY,
                    });
                }
                const {entry: sharedEntry, parentIds} = sharedEntryData;
                await sharedEntry.deletePermissions({parentIds, skipCheckPermissions: true});
            }),
        );
    };

    if (!skipDeletePermissions) {
        await deletePermissions();
    }

    ctx.log('DELETE_SHARED_ENTRIES_FINISH');

    return {
        entries: deletedEntries,
        deletePermissions: skipDeletePermissions ? deletePermissions : undefined,
    };
};
