import {definePresentableError} from './define';

export class FolderCopyDeniedError extends definePresentableError({
    code: 'FOLDER_COPY_DENIED',
    httpCode: 403,
    message: 'Folders cannot be copied',
}) {}

export class EntryWithoutWorkbookIdCopyDeniedError extends definePresentableError({
    code: 'ENTRY_WITHOUT_WORKBOOK_ID_COPY_DENIED',
    httpCode: 403,
    message: 'Entry without workbookId, cannot be copied to workbook',
}) {}

export class EntriesWithDifferentWorkbookIdsCopyDeniedError extends definePresentableError({
    code: 'ENTRIES_WITH_DIFFERENT_WORKBOOK_IDS_COPY_DENIED',
    httpCode: 403,
    message: 'Entries with different workbookIds cannot be copied',
}) {}

export class CollectionEntryCannotBeMigratedToWorkbookError extends definePresentableError({
    code: 'COLLECTION_ENTRY_CANNOT_BE_MIGRATED_TO_WORKBOOK',
    httpCode: 400,
    message: 'Entry cannot be migrated to workbook because it belongs to a collection',
}) {}

export class WorkbookEntryCannotBeMigratedToWorkbookError extends definePresentableError({
    code: 'WORKBOOK_ENTRY_CANNOT_BE_MIGRATED_TO_WORKBOOK',
    httpCode: 400,
    message: 'Entry cannot be migrated to workbook because it belongs to a workbook',
}) {}
