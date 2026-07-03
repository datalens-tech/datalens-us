import {definePresentableError} from './define';

export class NotExistTenantError extends definePresentableError({
    code: 'NOT_EXIST_TENANT',
    httpCode: 404,
    message: "The specified tenant doesn't exist",
}) {}
