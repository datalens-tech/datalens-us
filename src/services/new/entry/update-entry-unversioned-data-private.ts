import {raw} from 'objection';

import {NotExistEntryError, PrivateRouteOnlyError} from '../../../components/errors';
import {CURRENT_TIMESTAMP, DEFAULT_QUERY_TIMEOUT} from '../../../const';
import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {EntryColumns} from '../../../types/models';
import {makeUserId} from '../../../utils';
import {checkLock} from '../lock';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';

type UpdateUnversionedDataArgs = {
    entryId: string;
    unversionedData: EntryColumns['unversionedData'];
    lockToken?: string;
};

export const updateEntryUnversionedDataPrivate = async (
    {ctx, trx}: ServiceArgs,
    args: UpdateUnversionedDataArgs,
) => {
    const {entryId, unversionedData, lockToken} = args;

    ctx.log('UPDATE_UNVERSIONED_DATA_START', {
        entryId,
    });

    const {isPrivateRoute, user, tenantId} = ctx.get('info');

    if (!isPrivateRoute) {
        throw new PrivateRouteOnlyError();
    }

    await checkLock({ctx}, {entryId, lockToken});

    const updatedBy = makeUserId(user.userId);

    const updatedEntry = await Entry.query(getPrimary(trx))
        .patch({
            [EntryColumn.UnversionedData]: unversionedData,
            [EntryColumn.UpdatedBy]: updatedBy,
            [EntryColumn.UpdatedAt]: raw(CURRENT_TIMESTAMP),
        })
        .where({
            [EntryColumn.EntryId]: entryId,
            [EntryColumn.TenantId]: tenantId,
            [EntryColumn.IsDeleted]: false,
        })
        .returning('*')
        .first()
        .timeout(DEFAULT_QUERY_TIMEOUT);

    if (!updatedEntry) {
        throw new NotExistEntryError();
    }

    ctx.log('UPDATE_UNVERSIONED_DATA_SUCCESS');

    return updatedEntry;
};
