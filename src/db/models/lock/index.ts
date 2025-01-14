import {AppContext, AppError} from '@gravity-ui/nodekit';
import moment from 'moment';
import {DBError, transaction} from 'objection';
import PG_ERRORS from 'pg-error-constants';

import {Model} from '../..';
import {CURRENT_TIMESTAMP} from '../../../const';
import US_ERRORS from '../../../const/us-error-constants';
import {WorkbookPermission} from '../../../entities/workbook';
import {getWorkbook} from '../../../services/new/workbook';
import {checkWorkbookPermission} from '../../../services/new/workbook/utils/check-workbook-permission';
import * as MT from '../../../types/models';
import Utils from '../../../utils';
import {Entry} from '../new/entry';

import {
    validateExtendLockEntry,
    validateLockEntry,
    validateUnlockEntry,
    validateVerifyExistenceEntry,
} from './scheme';

interface Lock extends MT.LockColumns {}
class Lock extends Model {
    static get tableName() {
        return 'locks';
    }

    static get idColumn() {
        return 'lockId';
    }

    static uniqActiveLockConstraintName = 'uniq_active_lock_per_entry_id';

    static async pull({entryId}: {entryId: string}, trx?: any) {
        const currentDate = moment().format();

        return Lock.query(trx || this.primary)
            .select()
            .where('entryId', '=', entryId)
            .where('expiryDate', '>', currentDate)
            .first()
            .timeout(Model.DEFAULT_QUERY_TIMEOUT);
    }

    static async checkLock({entryId, lockToken}: MT.CheckLockConfig, ctx: MT.CTX) {
        const {user} = ctx.get('info');
        ctx.log('CHECK_LOCK_ENTRY_REQUEST', {entryId, requestedBy: user});

        const lock = await Lock.pull({entryId});

        let result;

        if (lock && lock.lockToken !== lockToken) {
            throw new AppError(US_ERRORS.ENTRY_IS_LOCKED, {
                code: US_ERRORS.ENTRY_IS_LOCKED,
                details: {
                    entryId: Utils.encodeId(entryId),
                    loginOrId: lock.login,
                    expiryDate: lock.expiryDate,
                },
            });
        } else {
            result = {
                lockToken,
            };
        }

        ctx.log('CHECK_LOCK_ENTRY_SUCCESS');

        return result;
    }

    static async verifyExistence(
        {tenantId, entryId, requestedBy, isPrivateRoute, dlContext}: MT.VerifyExistenceConfig,
        ctx: MT.CTX,
    ) {
        ctx.log('VERIFY_EXISTENCE_LOCK_ENTRY_REQUEST', {
            tenantId,
            entryId,
            requestedBy,
            dlContext,
        });

        const {isValid, validationErrors} = validateVerifyExistenceEntry({entryId, requestedBy});

        if (!isValid) {
            throw new AppError('Validation error', {
                code: US_ERRORS.VALIDATION_ERROR,
                details: {validationErrors},
            });
        }

        if (!isPrivateRoute) {
            await Lock.checkLockPermission({
                ctx,
                entryId,
                tenantId,
                permission: 'read',
            });
        }

        const lock = await Lock.pull({entryId});

        if (!lock) {
            throw new AppError('NOT_EXIST_LOCKED_ENTRY', {
                code: 'NOT_EXIST_LOCKED_ENTRY',
            });
        }

        ctx.log('VERIFY_EXISTENCE_LOCK_ENTRY_SUCCESS');

        return lock;
    }

    static async lock(
        {
            tenantId,
            entryId,
            duration = 300000,
            force = false,
            requestedBy,
            isPrivateRoute,
            dlContext,
        }: MT.LockConfig,
        ctx: MT.CTX,
    ) {
        ctx.log('LOCK_ENTRY_REQUEST', {
            tenantId,
            entryId,
            duration,
            dlContext,
        });

        const {isValid, validationErrors} = validateLockEntry({
            entryId,
            duration,
            force,
            requestedBy,
        });

        if (!isValid) {
            throw new AppError('Validation error', {
                code: US_ERRORS.VALIDATION_ERROR,
                details: {validationErrors},
            });
        }

        if (duration > 600000) {
            throw new AppError('The max duration is 600000', {
                code: 'DURATION_IS_LIMITED',
            });
        }

        if (!isPrivateRoute) {
            await Lock.checkLockPermission({
                ctx,
                entryId,
                tenantId,
                permission: 'edit',
            });
        }

        let result: Lock | undefined;

        const lockToken = Utils.generateLockToken();
        const expiryDate = moment().add(duration, 'ms').format();
        const {login} = requestedBy;

        try {
            result = await Lock.query(this.primary)
                .insert({
                    entryId,
                    lockToken,
                    expiryDate,
                    login,
                })
                .returning('*')
                .timeout(Model.DEFAULT_QUERY_TIMEOUT);
        } catch (error) {
            if (!(error instanceof DBError)) {
                throw error;
            }

            const nativeError = error.nativeError as {code?: string; constraint?: string};

            if (
                nativeError.code === PG_ERRORS.EXCLUSION_VIOLATION &&
                nativeError.constraint === this.uniqActiveLockConstraintName
            ) {
                const lockedEntry = await Lock.pull({entryId}, this.primary);

                if (lockedEntry && force) {
                    result = await Lock.query(this.primary)
                        .update({
                            lockToken,
                            startDate: this.raw(CURRENT_TIMESTAMP),
                            expiryDate,
                            login,
                        })
                        .where({
                            entryId,
                            lockToken: lockedEntry.lockToken,
                        })
                        .returning('*')
                        .first()
                        .timeout(Model.DEFAULT_QUERY_TIMEOUT);

                    if (!result) {
                        throw new AppError(US_ERRORS.ENTRY_LOCK_FORCE_CONFLICT, {
                            code: US_ERRORS.ENTRY_LOCK_FORCE_CONFLICT,
                        });
                    }
                } else if (lockedEntry) {
                    throw new AppError(US_ERRORS.ENTRY_IS_LOCKED, {
                        code: US_ERRORS.ENTRY_IS_LOCKED,
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

        return {
            lockToken: result.lockToken,
        };
    }

    static async unlock(
        {
            tenantId,
            entryId,
            lockToken,
            force = false,
            requestedBy,
            isPrivateRoute,
            dlContext,
        }: MT.UnlockConfig,
        ctx: MT.CTX,
    ) {
        ctx.log('UNLOCK_ENTRY_REQUEST', {tenantId, entryId, dlContext});

        const {isValid, validationErrors} = validateUnlockEntry({entryId, requestedBy});

        if (!isValid) {
            throw new AppError('Validation error', {
                code: US_ERRORS.VALIDATION_ERROR,
                details: {validationErrors},
            });
        }

        if (!isPrivateRoute) {
            await Lock.checkLockPermission({
                ctx,
                entryId,
                tenantId,
                permission: 'edit',
            });
        }

        if (!lockToken && !force) {
            throw new AppError('The correct lock token is required', {
                code: 'LOCK_TOKEN_REQUIRED',
            });
        }

        const result = await transaction(this.primary, async (trx) => {
            let result;

            const lockedEntry = await Lock.pull({entryId}, trx);

            if (!lockedEntry) {
                throw new AppError('NOT_EXIST_LOCKED_ENTRY', {
                    code: 'NOT_EXIST_LOCKED_ENTRY',
                });
            }

            if (lockedEntry && lockToken && lockedEntry.lockToken !== lockToken) {
                throw new AppError('The correct lock token is required', {
                    code: 'LOCK_TOKEN_REQUIRED',
                });
            }

            if (lockToken || force) {
                result = await Lock.query(trx)
                    .delete()
                    .where('entryId', '=', lockedEntry.entryId)
                    .where('lockToken', '=', lockedEntry.lockToken)
                    .returning('*')
                    .first()
                    .timeout(Model.DEFAULT_QUERY_TIMEOUT);
            }

            return result;
        });

        ctx.log('UNLOCK_ENTRY_SUCCESS');

        return result;
    }

    static async extend(
        {
            tenantId,
            entryId,
            duration = 300000,
            lockToken,
            force = false,
            requestedBy,
            isPrivateRoute,
            dlContext,
        }: MT.ExtendLockConfig,
        ctx: MT.CTX,
    ) {
        ctx.log('EXTEND_LOCK_ENTRY_REQUEST', {
            tenantId,
            entryId,
            duration,
            lockToken,
            force,
            dlContext,
        });

        const {isValid, validationErrors} = validateExtendLockEntry({
            entryId,
            duration,
            lockToken,
            force,
            requestedBy,
        });

        if (!isValid) {
            throw new AppError('Validation error', {
                code: US_ERRORS.VALIDATION_ERROR,
                details: {validationErrors},
            });
        }

        if (duration > 600000) {
            throw new AppError('The max duration is 600000', {
                code: 'DURATION_IS_LIMITED',
            });
        }

        if (!isPrivateRoute) {
            await Lock.checkLockPermission({
                ctx,
                entryId,
                tenantId,
                permission: 'edit',
            });
        }

        const result = await transaction(this.primary, async (trx) => {
            const expiryDate = moment().add(duration, 'ms').format();
            let result;

            const lockedEntry = await Lock.pull({entryId}, trx);

            if (!lockedEntry) {
                throw new AppError('NOT_EXIST_LOCKED_ENTRY', {
                    code: 'NOT_EXIST_LOCKED_ENTRY',
                });
            }

            if (
                (lockedEntry && lockToken && lockedEntry.lockToken !== lockToken) ||
                (!force && !lockToken)
            ) {
                throw new AppError('LOCK_TOKEN_REQUIRED', {
                    code: 'LOCK_TOKEN_REQUIRED',
                });
            }

            if (lockedEntry || force) {
                result = await Lock.query(trx)
                    .where({
                        entryId,
                        lockToken: lockedEntry.lockToken,
                    })
                    .update({
                        expiryDate,
                        login: requestedBy.login,
                    })
                    .first()
                    .returning('*')
                    .timeout(Model.DEFAULT_QUERY_TIMEOUT);
            }

            return result;
        });

        ctx.log('EXTEND_LOCK_ENTRY_SUCCESS');

        return result;
    }

    private static async checkLockPermission({
        ctx,
        entryId,
        tenantId,
        permission,
    }: {
        ctx: AppContext;
        entryId: string;
        tenantId: string;
        permission: 'read' | 'edit';
    }) {
        const registry = ctx.get('registry');
        const {accessServiceEnabled} = ctx.config;

        const entry = await Entry.query(Entry.replica)
            .where({
                entryId,
                tenantId,
                isDeleted: false,
            })
            .first()
            .timeout(Entry.DEFAULT_QUERY_TIMEOUT);

        if (!entry) {
            throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
                code: US_ERRORS.NOT_EXIST_ENTRY,
            });
        }

        if (entry.workbookId) {
            if (accessServiceEnabled) {
                const workbook = await getWorkbook(
                    {ctx, skipCheckPermissions: true},
                    {workbookId: entry.workbookId},
                );

                let workbookPermission: WorkbookPermission;
                if (permission === 'edit') {
                    workbookPermission = WorkbookPermission.Update;
                } else {
                    workbookPermission = WorkbookPermission.LimitedView;
                }

                await checkWorkbookPermission({
                    ctx,
                    workbook,
                    permission: workbookPermission,
                });
            }
        } else if (ctx.config.dlsEnabled) {
            const {DLS} = registry.common.classes.get();
            await DLS.checkPermission(
                {ctx},
                {
                    entryId,
                    action: permission,
                },
            );
        }
    }
}

export default Lock;
