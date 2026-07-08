import {definePresentableError} from './define';

export class NotExistDeletedEntryError extends definePresentableError({
    code: 'NOT_EXIST_DELETED_ENTRY',
    httpCode: 404,
    message: "The entity doesn't exist",
}) {}

export class EntryAlreadyExistsError extends definePresentableError({
    code: 'ERR.US.ENTRY_ALREADY_EXISTS',
    httpCode: 409,
    message: 'The entry already exists',
}) {}

export class EntryIsNotInWorkbookError extends definePresentableError({
    code: 'ENTRY_IS_NOT_IN_WORKBOOK',
    httpCode: 400,
    message: 'The entry is not in a workbook',
}) {}

export class EntryAndWorkbookTenantMismatchError extends definePresentableError({
    code: 'ENTRY_AND_WORKBOOK_TENANT_MISMATCH',
    httpCode: 500,
    message: 'The entry and workbook belong to different tenants',
}) {}

export class EntryAndCollectionTenantMismatchError extends definePresentableError({
    code: 'ENTRY_AND_COLLECTION_TENANT_MISMATCH',
    httpCode: 500,
    message: 'The entry and collection belong to different tenants',
}) {}

export class EntriesWithInsufficientPermissionsError extends definePresentableError({
    code: 'ENTRIES_WITH_INSUFFICIENT_PERMISSIONS',
    httpCode: 403,
    message:
        "You can't do this action because of you don't have enough permissions for some entries",
}) {}

export class EntriesRequireCollectionIdError extends definePresentableError({
    code: 'ENTRIES_REQUIRE_COLLECTION_ID',
    httpCode: 400,
    message: 'Collection ID is required for entries',
}) {}

export class CollectionEntryRequireCollectionIdError extends definePresentableError({
    code: 'COLLECTION_ENTRY_REQUIRE_COLLECTION_ID',
    httpCode: 400,
    message: 'Collection ID is required for a collection entry',
}) {}

export class ComputeEntriesFeatureDisabledError extends definePresentableError({
    code: 'COMPUTE_ENTRIES_FEATURE_DISABLED',
    httpCode: 400,
    message: 'Compute entries feature is disabled',
}) {}

export class ComputeEntryInvalidTypeError extends definePresentableError({
    code: 'COMPUTE_ENTRY_INVALID_TYPE',
    httpCode: 400,
    message: 'Invalid compute entry type',
}) {}

export class ComputeEntryTypeChangeForbiddenError extends definePresentableError({
    code: 'COMPUTE_ENTRY_TYPE_CHANGE_FORBIDDEN',
    httpCode: 400,
    message: 'Compute entry type cannot be changed',
}) {}

export class ParentFolderNotExistError extends definePresentableError({
    code: 'PARENT_FOLDER_NOT_EXIST',
    httpCode: 400,
    message: "Couldn't find these parent folders",
}) {}

export class FolderAlreadyExistsWithDifferentKeyCaseError extends definePresentableError<{
    existedKey: string;
    key: string;
}>({
    code: 'ERR.US.FOLDER_ALREADY_EXISTS_WITH_DIFFERENT_KEY_CASE',
    httpCode: 409,
    message: 'A folder with the same path already exists with a different key case',
}) {}

export class ModifyUsersFolderDeniedError extends definePresentableError({
    code: 'MODIFY_USERS_FOLDER_DENIED',
    httpCode: 403,
    message: "Folder 'Users' cannot be modified",
}) {}

export class NotExistEntryError extends definePresentableError({
    code: 'NOT_EXIST_ENTRY',
    httpCode: 404,
    message: "The entry doesn't exist",
}) {}
