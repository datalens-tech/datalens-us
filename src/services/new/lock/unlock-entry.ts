import {transaction} from 'objection';

import {LockTokenRequiredError, NotExistLockedEntryError} from '../../../components/errors';
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
        throw new LockTokenRequiredError({message: 'The correct lock token is required'});
    }

    if (!isPrivateRoute) {
        await checkLockPermission({ctx}, {entryId, permission: 'edit'});
    }

    const result = await transaction(getPrimary(), async (trx) => {
        const lockedEntry = await pullActiveLock({entryId, trx});

        if (!lockedEntry) {
            throw new NotExistLockedEntryError();
        }

        if (lockToken && lockedEntry.lockToken !== lockToken) {
            throw new LockTokenRequiredError();
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
