import {AppError} from '@gravity-ui/nodekit';
import {transaction} from 'objection';

import {US_ERRORS} from '../../../const/errors';
import {Lock, LockColumn} from '../../../db/models/new/lock';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';

import {checkLockPermission, pullActiveLock} from './utils';

export interface UnlockEntryArgs {
    entryId: string;
    lockToken?: string;
    force?: boolean;
}

export const unlockEntry = async (
    {ctx}: ServiceArgs,
    {entryId, lockToken, force = false}: UnlockEntryArgs,
) => {
    const {tenantId, isPrivateRoute, dlContext} = ctx.get('info');
    ctx.log('UNLOCK_ENTRY_REQUEST', {tenantId, entryId, dlContext});

    if (!lockToken && !force) {
        throw new AppError('The correct lock token is required', {
            code: US_ERRORS.LOCK_TOKEN_REQUIRED,
        });
    }

    if (!isPrivateRoute) {
        await checkLockPermission({ctx}, {entryId, permission: 'edit'});
    }

    const result = await transaction(getPrimary(), async (trx) => {
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
            .delete()
            .where({
                [LockColumn.EntryId]: lockedEntry.entryId,
                [LockColumn.LockToken]: lockedEntry.lockToken,
            })
            .returning('*')
            .first()
            .timeout(Lock.DEFAULT_QUERY_TIMEOUT);
    });

    ctx.log('UNLOCK_ENTRY_SUCCESS');

    return result;
};
