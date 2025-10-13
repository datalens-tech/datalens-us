import {AppError} from '@gravity-ui/nodekit';
import {transaction} from 'objection';

import {US_ERRORS} from '../../../const';
import Lock from '../../../db/models/lock';
import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {SharedEntryPermission} from '../../../entities/shared-entry';
import {SharedEntryInstance} from '../../../registry/plugins/common/entities/shared-entry/types';
import Utils, {makeUserId} from '../../../utils';
import {markEntryAsDeleted} from '../../entry/crud';
import {makeSharedEntriesWithParentsMap} from '../collection/utils/get-parents';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';

export interface DeleteSharedEntriesArgs {
    entryIds: string[];
    skipCheckPermissions?: boolean;
}

export const deleteSharedEntries = async (
    {ctx, trx}: ServiceArgs,
    args: DeleteSharedEntriesArgs,
) => {
    const {entryIds, skipCheckPermissions = false} = args;

    ctx.log('DELETE_SHARED_ENTRIES_START', {
        entryIds: await Utils.macrotasksMap(entryIds, (id) => Utils.encodeId(id)),
    });

    const {accessServiceEnabled} = ctx.config;

    const {
        user: {userId},
        isPrivateRoute,
    } = ctx.get('info');
    const registry = ctx.get('registry');
    const {SharedEntry} = registry.common.classes.get();

    const entries = await Entry.query(getPrimary(trx))
        .select()
        .whereIn([EntryColumn.EntryId], entryIds)
        .where({isDeleted: false})
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

    const result = await transaction(getPrimary(trx), async (transactionTrx) => {
        const entryDeletedBy = makeUserId(userId);

        return await Promise.all(
            entries.map(async (entry) => {
                const {entryId, displayKey, key} = entry;

                await Lock.checkLock({entryId}, ctx);

                const sharedEntryData = sharedEntriesIdsMap.get(entryId);
                if (!sharedEntryData) {
                    throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
                        code: US_ERRORS.NOT_EXIST_ENTRY,
                    });
                }

                const {entry: sharedEntry, parentIds} = sharedEntryData;
                await sharedEntry.deletePermissions({parentIds, skipCheckPermissions: true});

                const newInnerMeta = {
                    ...entry.innerMeta,
                    oldKey: key as string,
                    oldDisplayKey: displayKey as string,
                };

                return markEntryAsDeleted(transactionTrx, {
                    entryId,
                    newKey: key as string,
                    newDisplayKey: displayKey as string,
                    newInnerMeta,
                    updatedBy: entryDeletedBy,
                });
            }),
        );
    });

    ctx.log('DELETE_SHARED_ENTRIES_FINISH');

    const deletedEntries = result.filter((entry) => entry !== undefined);

    return deletedEntries;
};
