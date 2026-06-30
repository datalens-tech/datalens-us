import {definePresentableError} from './define';

export class CollectionNotExistsError extends definePresentableError({
    code: 'COLLECTION_NOT_EXISTS',
    httpCode: 404,
    message: "The collection doesn't exist",
}) {}

export class CollectionAlreadyExistsError extends definePresentableError({
    code: 'COLLECTION_ALREADY_EXISTS',
    httpCode: 409,
    message: 'The collection already exists',
}) {}

export class CollectionCircularReferenceError extends definePresentableError({
    code: 'COLLECTION_CIRCULAR_REFERENCE_ERROR',
    httpCode: 409,
    message: 'Circular reference error between collections',
}) {}

export class CollectionWithWorkbookTemplateCantBeDeletedError extends definePresentableError({
    code: 'COLLECTION_WITH_WORKBOOK_TEMPLATE_CANT_BE_DELETED',
    httpCode: 403,
    message: "Collection with workbook template can't be deleted",
}) {}

export class CollectionEntryUnsupportedScopeError extends definePresentableError({
    code: 'COLLECTION_ENTRY_UNSUPPORTED_SCOPE',
    httpCode: 400,
    message: 'Unsupported collection entry scope',
}) {}

export class SharedEntriesNotSupportedError extends definePresentableError({
    code: 'SHARED_ENTRIES_NOT_SUPPORTED',
    httpCode: 400,
    message: 'Shared entries are not supported in this installation',
}) {}
