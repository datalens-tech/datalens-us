import {type PresentableErrorArgs, definePresentableError} from './define';

export class UsValidationError extends definePresentableError({
    code: 'VALIDATION_ERROR',
    httpCode: 400,
    message: 'Validation error',
}) {}

export class TenantHeaderRequiredError extends UsValidationError {
    constructor(args: PresentableErrorArgs = {}) {
        super({details: {message: 'Tenant header is required'}, ...args});
    }
}

export class MustProvideTenantIdOrInstanceIdError extends UsValidationError {
    constructor(args: PresentableErrorArgs = {}) {
        super({message: 'Must be provided tenantId or instanceId', ...args});
    }
}
