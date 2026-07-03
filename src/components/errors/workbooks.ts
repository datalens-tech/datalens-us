import {definePresentableError} from './define';

export class WorkbookNotExistsError extends definePresentableError({
    code: 'WORKBOOK_NOT_EXISTS',
    httpCode: 404,
    message: "The workbook doesn't exist",
}) {}

export class WorkbookAlreadyExistsError extends definePresentableError({
    code: 'WORKBOOK_ALREADY_EXISTS',
    httpCode: 409,
    message: 'The workbook already exists',
}) {}

export class WorkbookIsAlreadyRestoredError extends definePresentableError({
    code: 'WORKBOOK_IS_ALREADY_RESTORED',
    httpCode: 400,
    message: 'The workbook is already restored',
}) {}

export class WorkbookCopyFileConnectionError extends definePresentableError({
    code: 'WORKBOOK_COPY_FILE_CONNECTION_ERROR',
    httpCode: 400,
    message: 'Copying workbooks with file connections is forbidden',
}) {}

export class WorkbookIsolationInterruptionError extends definePresentableError({
    code: 'WORKBOOK_ISOLATION_INTERRUPTION',
    httpCode: 403,
    message: 'Workbook isolation interruption',
}) {}

export class WorkbookTemplateNotExistsError extends definePresentableError({
    code: 'WORKBOOK_TEMPLATE_NOT_EXISTS',
    httpCode: 404,
    message: "The workbook template doesn't exist",
}) {}

export class WorkbookTemplateCantBeDeletedError extends definePresentableError({
    code: 'WORKBOOK_TEMPLATE_CANT_BE_DELETED',
    httpCode: 403,
    message: "Workbook template can't be deleted",
}) {}
