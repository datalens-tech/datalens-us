import {definePresentableError} from './define';

export class AccessServicePermissionDeniedError extends definePresentableError({
    code: 'ACCESS_SERVICE_PERMISSION_DENIED',
    httpCode: 403,
    message: 'Auth denied',
}) {}
