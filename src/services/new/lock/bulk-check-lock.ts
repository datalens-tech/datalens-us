import {AppError} from '@gravity-ui/nodekit';
import moment from 'moment';

import {US_ERRORS} from '../../../const/errors';
import {Lock, LockColumn} from '../../../db/models/new/lock';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';

import {CheckLockArgs} from './check-lock';

export const bulkCheckLock = async ({ctx, trx}: ServiceArgs, {items}: {items: CheckLockArgs[]}) => {
    const {user} = ctx.get('info');
    ctx.log('BULK_CHECK_LOCK_ENTRY_REQUEST', {itemsCount: items.length, requestedBy: user});

    const entryIds = items.map((item) => item.entryId);
    const currentDate = moment().format();

    const locks = await Lock.query(getPrimary(trx))
        .select()
        .whereIn(LockColumn.EntryId, entryIds)
        .where(LockColumn.ExpiryDate, '>', currentDate)
        .timeout(Lock.DEFAULT_QUERY_TIMEOUT);

    const locksMap = new Map(locks.map((lock) => [lock.entryId, lock]));

    const results = items.map((item) => {
        const lock = locksMap.get(item.entryId);

        if (lock && lock.lockToken !== item.lockToken) {
            throw new AppError(US_ERRORS.ENTRY_IS_LOCKED, {
                code: US_ERRORS.ENTRY_IS_LOCKED,
                details: {
                    entryId: Utils.encodeId(item.entryId),
                    loginOrId: lock.login,
                    expiryDate: lock.expiryDate,
                },
            });
        }

        return {entryId: item.entryId, lockToken: item.lockToken};
    });

    ctx.log('BULK_CHECK_LOCK_ENTRY_SUCCESS');

    return results;
};
