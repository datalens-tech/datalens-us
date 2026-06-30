import {NotExistLockedEntryError} from '../../../components/errors';
import {ServiceArgs} from '../types';

import {checkLockPermission, pullActiveLock} from './utils';

export const verifyLockExistence = async ({ctx}: ServiceArgs, {entryId}: {entryId: string}) => {
    const {tenantId, isPrivateRoute, dlContext, user: requestedBy} = ctx.get('info');
    ctx.log('VERIFY_EXISTENCE_LOCK_ENTRY_REQUEST', {tenantId, entryId, requestedBy, dlContext});

    if (!isPrivateRoute) {
        await checkLockPermission({ctx}, {entryId, permission: 'read'});
    }

    const lock = await pullActiveLock({entryId});

    if (!lock) {
        throw new NotExistLockedEntryError();
    }

    ctx.log('VERIFY_EXISTENCE_LOCK_ENTRY_SUCCESS');

    return lock;
};
