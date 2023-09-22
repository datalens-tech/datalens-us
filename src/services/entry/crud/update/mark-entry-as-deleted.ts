import {TransactionOrKnex, raw} from 'objection';
import {EntryColumns} from '../../../../types/models';
import Entry from '../../../../db/models/entry';
import {DEFAULT_QUERY_TIMEOUT, TRASH_FOLDER, CURRENT_TIMESTAMP} from '../../../../const';

export type MarkEntryDeletedData = {
    entryId: EntryColumns['entryId'];
    newKey: EntryColumns['key'];
    newDisplayKey: EntryColumns['displayKey'];
    newInnerMeta: EntryColumns['innerMeta'];
    updatedBy: EntryColumns['updatedBy'];
};

export async function markEntryAsDeleted(
    trx: TransactionOrKnex,
    {entryId, newKey, newDisplayKey, newInnerMeta, updatedBy}: MarkEntryDeletedData,
) {
    return await Entry.query(trx)
        .patch({
            key: `${TRASH_FOLDER}/${newKey}`,
            displayKey: `${TRASH_FOLDER}/${newDisplayKey}`,
            innerMeta: newInnerMeta,
            updatedBy: updatedBy,
            isDeleted: true,
            updatedAt: raw(CURRENT_TIMESTAMP),
            deletedAt: raw(CURRENT_TIMESTAMP),
        })
        .where({
            entryId,
        })
        .timeout(DEFAULT_QUERY_TIMEOUT);
}
