import {AppError} from '@gravity-ui/nodekit';
import moment from 'moment';
import {transaction} from 'objection';

import {US_ERRORS} from '../../../const/errors';
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
        throw new AppError(`The max duration is ${MAX_LOCK_DURATION}`, {
            code: US_ERRORS.DURATION_IS_LIMITED,
        });
    }

    if (!force && !lockToken) {
        throw new AppError(US_ERRORS.LOCK_TOKEN_REQUIRED, {
            code: US_ERRORS.LOCK_TOKEN_REQUIRED,
        });
    }

    if (!isPrivateRoute) {
        await checkLockPermission({ctx}, {entryId, permission: 'edit'});
    }

    const result = await transaction(getPrimary(), async (trx) => {
        const expiryDate = moment().add(duration, 'ms').format();
        const lockedEntry = await pullActiveLock({entryId, trx});

        if (!lockedEntry) {
            throw new AppError(US_ERRORS.NOT_EXIST_LOCKED_ENTRY, {
                code: US_ERRORS.NOT_EXIST_LOCKED_ENTRY,
            });
        }

        if (lockToken && lockedEntry.lockToken !== lockToken) {
            throw new AppError(US_ERRORS.LOCK_TOKEN_REQUIRED, {
                code: US_ERRORS.LOCK_TOKEN_REQUIRED,
            });
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
