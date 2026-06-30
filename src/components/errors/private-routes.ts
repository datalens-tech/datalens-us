import {definePresentableError} from './define';

export class PrivateClientScopeForbiddenError extends definePresentableError({
    code: 'PRIVATE_CLIENT_SCOPE_FORBIDDEN',
    httpCode: 403,
    message: 'The private client is not allowed to access this entry scope',
}) {}
