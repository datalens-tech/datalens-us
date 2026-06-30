import {EntryIsLockedError} from '../../../components/errors';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';

import {pullActiveLock} from './utils';

export interface CheckLockArgs {
    entryId: string;
    lockToken?: string;
}

export const checkLock = async ({ctx, trx}: ServiceArgs, {entryId, lockToken}: CheckLockArgs) => {
    const {user} = ctx.get('info');
    ctx.log('CHECK_LOCK_ENTRY_REQUEST', {entryId, requestedBy: user});

    const lock = await pullActiveLock({entryId, trx});

    if (lock && lock.lockToken !== lockToken) {
        throw new EntryIsLockedError({
            details: {
                entryId: Utils.encodeId(entryId),
                loginOrId: lock.login,
                expiryDate: lock.expiryDate,
            },
        });
    }

    ctx.log('CHECK_LOCK_ENTRY_SUCCESS');

    return {lockToken};
};
