import {definePresentableError} from './define';

export class IncorrectLinkError extends definePresentableError({
    code: 'INCORRECT_LINK_ERROR',
    httpCode: 400,
    message: 'Some of the provided links are incorrect',
}) {}

export class SyncLinksFailedError extends definePresentableError({
    code: 'SYNC_LINKS_FAILED',
    httpCode: 500,
    message: 'Failed to sync entry links',
}) {}
