import Lock from '../db/models/lock';
import * as ST from '../types/services.types';

export default class LockService {
    static async verifyExistence({entryId, ctx}: ST.VerifyLockExistence) {
        const {requestId, tenantId, user, isPrivateRoute, dlContext} = ctx.get('info');

        return await Lock.verifyExistence(
            {
                requestId,
                tenantId,
                entryId,
                requestedBy: user,
                isPrivateRoute,
                dlContext,
            },
            ctx,
        );
    }

    static async lock({entryId, duration, force, ctx}: ST.LockEntry) {
        const {requestId, tenantId, user, isPrivateRoute, dlContext} = ctx.get('info');

        return await Lock.lock(
            {
                requestId,
                tenantId,
                entryId,
                duration,
                force,
                requestedBy: user,
                isPrivateRoute,
                dlContext,
            },
            ctx,
        );
    }

    static async unlock({entryId, lockToken, force, ctx}: ST.UnlockEntry) {
        const {requestId, tenantId, user, isPrivateRoute, dlContext} = ctx.get('info');

        return await Lock.unlock(
            {
                requestId,
                tenantId,
                entryId,
                lockToken,
                force,
                requestedBy: user,
                isPrivateRoute,
                dlContext,
            },
            ctx,
        );
    }

    static async extend({entryId, duration, lockToken, force, ctx}: ST.ExtendLock) {
        const {requestId, tenantId, user, isPrivateRoute, dlContext} = ctx.get('info');

        return await Lock.extend(
            {
                requestId,
                tenantId,
                entryId,
                duration,
                lockToken,
                force,
                requestedBy: user,
                isPrivateRoute,
                dlContext,
            },
            ctx,
        );
    }
}
