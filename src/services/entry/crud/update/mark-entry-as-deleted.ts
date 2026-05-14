import {TransactionOrKnex, raw} from 'objection';

import {CURRENT_TIMESTAMP, DEFAULT_QUERY_TIMEOUT, TRASH_FOLDER} from '../../../../const';
import {Entry, EntryColumn} from '../../../../db/models/new/entry';
import {EntryScope} from '../../../../db/models/new/entry/types';
import {EntryColumns} from '../../../../types/models';
import {Utils} from '../../../../utils/utils';
import {ServiceArgs} from '../../../new/types';
import {getPrimary} from '../../../new/utils';

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
        .returning('*')
        .first()
        .timeout(DEFAULT_QUERY_TIMEOUT);
}

type MarkEntriesAsDeletedData = Array<{
    entryId: EntryColumns['entryId'];
    key: EntryColumns['key'];
    displayKey: EntryColumns['displayKey'];
    innerMeta: EntryColumns['innerMeta'];
    updatedBy: EntryColumns['updatedBy'];
    // These fields are required only because we cannot perform an insert without them,
    // as they are defined as NOT NULL columns in the database.
    scope: EntryScope;
    type: string;
    createdBy: string;
}>;

export async function markEntriesAsDeleted({trx}: ServiceArgs, data: MarkEntriesAsDeletedData) {
    if (data.length === 0) {
        return [];
    }

    return await Entry.query(getPrimary(trx))
        .insert(
            data.map(({entryId, key, displayKey, innerMeta, updatedBy, scope, type, createdBy}) => {
                const newKey = `${TRASH_FOLDER}/${entryId}_${Utils.getNameByKey({key})}`;
                return {
                    entryId,
                    key: newKey,
                    displayKey: newKey,
                    innerMeta: {
                        ...innerMeta,
                        oldKey: key,
                        oldDisplayKey: displayKey,
                    },
                    updatedBy,
                    isDeleted: true,
                    updatedAt: raw(CURRENT_TIMESTAMP),
                    deletedAt: raw(CURRENT_TIMESTAMP),
                    scope,
                    type,
                    createdBy,
                };
            }),
        )
        .onConflict(EntryColumn.EntryId)
        .merge()
        .returning('*')
        .timeout(DEFAULT_QUERY_TIMEOUT);
}
