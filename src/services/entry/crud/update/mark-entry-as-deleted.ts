import {TransactionOrKnex, raw} from 'objection';

import {CURRENT_TIMESTAMP, DEFAULT_QUERY_TIMEOUT, TRASH_FOLDER} from '../../../../const';
import {Entry, EntryColumn} from '../../../../db/models/new/entry';
import {EntryScope} from '../../../../db/models/new/entry/types';
import {EntryColumns} from '../../../../types/models';
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

// These fields are required only because we cannot perform an insert without them,
// as they are defined as NOT NULL columns in the database.
type ExtraNonNullableEntryData = {
    scope: EntryScope;
    type: string;
    createdBy: string;
};

export type MarkEntriesAsDeletedData = Array<MarkEntryDeletedData & ExtraNonNullableEntryData>;

export async function markEntriesAsDeleted({trx}: ServiceArgs, data: MarkEntriesAsDeletedData) {
    if (data.length === 0) {
        return [];
    }

    return await Entry.query(getPrimary(trx))
        .insert(
            data.map(
                ({
                    entryId,
                    newKey,
                    newDisplayKey,
                    newInnerMeta,
                    updatedBy,
                    scope,
                    type,
                    createdBy,
                }) => ({
                    entryId,
                    key: `${TRASH_FOLDER}/${newKey}`,
                    displayKey: `${TRASH_FOLDER}/${newDisplayKey}`,
                    innerMeta: newInnerMeta,
                    updatedBy,
                    isDeleted: true,
                    updatedAt: raw(CURRENT_TIMESTAMP),
                    deletedAt: raw(CURRENT_TIMESTAMP),
                    scope,
                    type,
                    createdBy,
                }),
            ),
        )
        .onConflict(EntryColumn.EntryId)
        .merge()
        .returning('*')
        .timeout(DEFAULT_QUERY_TIMEOUT);
}
