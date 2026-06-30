import moment from 'moment';
import {transaction} from 'objection';

import {
    LockDurationIsLimitedError,
    LockTokenRequiredError,
    NotExistLockedEntryError,
} from '../../../components/errors';
import {Lock, LockColumn} from '../../../db/models/new/lock';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';

import {DEFAULT_LOCK_DURATION, MAX_LOCK_DURATION} from './constants';
import {checkLockPermission, pullActiveLock} from './utils';

export interface ExtendLockArgs {
    entryId: string;
    duration?: number;
    lockToken?: string;
    force?: boolean;
}

export const extendLock = async (
    {ctx}: ServiceArgs,
    {entryId, duration = DEFAULT_LOCK_DURATION, lockToken, force = false}: ExtendLockArgs,
) => {
    const {tenantId, isPrivateRoute, dlContext, user: requestedBy} = ctx.get('info');
    ctx.log('EXTEND_LOCK_ENTRY_REQUEST', {
        tenantId,
        entryId,
        duration,
        lockToken,
        force,
        dlContext,
    });

    if (duration > MAX_LOCK_DURATION) {
        throw new LockDurationIsLimitedError({message: `The max duration is ${MAX_LOCK_DURATION}`});
    }

    if (!force && !lockToken) {
        throw new LockTokenRequiredError();
    }

    if (!isPrivateRoute) {
        await checkLockPermission({ctx}, {entryId, permission: 'edit'});
    }

    const result = await transaction(getPrimary(), async (trx) => {
        const expiryDate = moment().add(duration, 'ms').format();
        const lockedEntry = await pullActiveLock({entryId, trx});

        if (!lockedEntry) {
            throw new NotExistLockedEntryError();
        }

        if (lockToken && lockedEntry.lockToken !== lockToken) {
            throw new LockTokenRequiredError();
        }

        return Lock.query(trx)
            .where({
                [LockColumn.EntryId]: entryId,
                [LockColumn.LockToken]: lockedEntry.lockToken,
            })
            .update({
                [LockColumn.ExpiryDate]: expiryDate,
                [LockColumn.Login]: requestedBy.login,
            })
            .returning('*')
            .first()
            .timeout(Lock.DEFAULT_QUERY_TIMEOUT);
    });

    ctx.log('EXTEND_LOCK_ENTRY_SUCCESS');

    return result;
};
