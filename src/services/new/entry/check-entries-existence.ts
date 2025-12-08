import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

export type CheckEntriesExistenceArgs = {
    entryIds: string[];
    invalidEntryIds: string[];
};

export type CheckEntriesExistenceResult = Set<string>;

export const checkEntriesExistence = async (
    {ctx, trx}: ServiceArgs,
    args: CheckEntriesExistenceArgs,
): Promise<CheckEntriesExistenceResult> => {
    const {entryIds, invalidEntryIds} = args;
    const {tenantId} = ctx.get('info');

    ctx.log('CHECK_ENTRIES_EXISTENCE_REQUEST', {
        entryIdsCount: entryIds.length,
        invalidEntryIdsCount: invalidEntryIds.length,
    });

    // Query existing entries
    const existingEntries =
        entryIds.length > 0
            ? await Entry.query(getReplica(trx))
                  .select(EntryColumn.EntryId)
                  .whereIn(EntryColumn.EntryId, entryIds)
                  .where({
                      [EntryColumn.TenantId]: tenantId,
                      [EntryColumn.IsDeleted]: false,
                  })
                  .timeout(Entry.DEFAULT_QUERY_TIMEOUT)
            : ([] as Pick<Entry, typeof EntryColumn.EntryId>[]);

    ctx.log('CHECK_ENTRIES_EXISTENCE_SUCCESS', {
        existingCount: existingEntries.length,
    });

    return new Set(existingEntries.map((entry) => entry[EntryColumn.EntryId]));
};
