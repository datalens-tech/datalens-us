import {definePresentableError} from './define';

export class CircularReferenceError extends definePresentableError({
    code: 'CIRCULAR_REFERENCE_ERROR',
    httpCode: 409,
    message: 'Circular reference error',
}) {}

export class InvalidPageTokenError extends definePresentableError({
    code: 'INVALID_PAGE_TOKEN',
    httpCode: 400,
    message: 'Invalid page token',
}) {}
