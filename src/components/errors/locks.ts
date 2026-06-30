import {definePresentableError} from './define';

export class EntryIsLockedError extends definePresentableError({
    code: 'ERR.US.ENTRY_IS_LOCKED',
    httpCode: 423,
    message: 'The entry is locked',
}) {}

export class EntryLockForceConflictError extends definePresentableError({
    code: 'ERR.US.ENTRY_LOCK_FORCE_CONFLICT',
    httpCode: 409,
    message: 'Conflict occurred while setting a forced lock',
}) {}

export class NotExistLockedEntryError extends definePresentableError({
    code: 'NOT_EXIST_LOCKED_ENTRY',
    httpCode: 404,
    message: "The entity isn't locked",
}) {}

export class LockTokenRequiredError extends definePresentableError({
    code: 'LOCK_TOKEN_REQUIRED',
    httpCode: 400,
    message: 'The lock token is required',
}) {}

export class LockDurationIsLimitedError extends definePresentableError({
    code: 'DURATION_IS_LIMITED',
    httpCode: 400,
    message: 'The duration is limited',
}) {}
