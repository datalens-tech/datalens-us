import moment from 'moment';
import {DBError, raw} from 'objection';
import PG_ERRORS from 'pg-error-constants';

import {
    EntryIsLockedError,
    EntryLockForceConflictError,
    LockDurationIsLimitedError,
} from '../../../components/errors';
import {CURRENT_TIMESTAMP} from '../../../const';
import {Lock, LockColumn} from '../../../db/models/new/lock';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';

import {DEFAULT_LOCK_DURATION, MAX_LOCK_DURATION} from './constants';
import {checkLockPermission, pullActiveLock} from './utils';

const UNIQ_ACTIVE_LOCK_CONSTRAINT = 'uniq_active_lock_per_entry_id';

export interface LockEntryArgs {
    entryId: string;
    duration?: number;
    force?: boolean;
}

export const lockEntry = async (
    {ctx}: ServiceArgs,
    {entryId, duration = DEFAULT_LOCK_DURATION, force = false}: LockEntryArgs,
) => {
    const {tenantId, isPrivateRoute, dlContext, user: requestedBy} = ctx.get('info');
    ctx.log('LOCK_ENTRY_REQUEST', {tenantId, entryId, duration, dlContext});

    if (duration > MAX_LOCK_DURATION) {
        throw new LockDurationIsLimitedError({message: `The max duration is ${MAX_LOCK_DURATION}`});
    }

    if (!isPrivateRoute) {
        await checkLockPermission({ctx}, {entryId, permission: 'edit'});
    }

    const lockToken = Utils.generateLockToken();
    const expiryDate = moment().add(duration, 'ms').format();
    const {login} = requestedBy;

    let result: InstanceType<typeof Lock> | undefined;

    try {
        result = await Lock.query(getPrimary())
            .insert({
                [LockColumn.EntryId]: entryId,
                [LockColumn.LockToken]: lockToken,
                [LockColumn.ExpiryDate]: expiryDate,
                [LockColumn.Login]: login,
            })
            .returning('*')
            .timeout(Lock.DEFAULT_QUERY_TIMEOUT);
    } catch (error) {
        if (!(error instanceof DBError)) {
            throw error;
        }

        const nativeError = error.nativeError as {code?: string; constraint?: string};

        if (
            nativeError.code === PG_ERRORS.EXCLUSION_VIOLATION &&
            nativeError.constraint === UNIQ_ACTIVE_LOCK_CONSTRAINT
        ) {
            const lockedEntry = await pullActiveLock({entryId, trx: getPrimary()});

            if (lockedEntry && force) {
                result = await Lock.query(getPrimary())
                    .update({
                        [LockColumn.LockToken]: lockToken,
                        [LockColumn.StartDate]: raw(CURRENT_TIMESTAMP),
                        [LockColumn.ExpiryDate]: expiryDate,
                        [LockColumn.Login]: login,
                    })
                    .where({
                        [LockColumn.EntryId]: entryId,
                        [LockColumn.LockToken]: lockedEntry.lockToken,
                    })
                    .returning('*')
                    .first()
                    .timeout(Lock.DEFAULT_QUERY_TIMEOUT);

                if (!result) {
                    throw new EntryLockForceConflictError();
                }
            } else if (lockedEntry) {
                throw new EntryIsLockedError({
                    details: {
                        loginOrId: lockedEntry.login,
                        expiryDate: lockedEntry.expiryDate,
                    },
                });
            } else {
                throw error;
            }
        } else {
            throw error;
        }
    }

    ctx.log('LOCK_ENTRY_SUCCESS');

    return {lockToken: result.lockToken};
};
