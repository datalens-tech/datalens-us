import {definePresentableError} from './define';

export class ModeNotAllowedError extends definePresentableError({
    code: 'MODE_NOT_ALLOWED',
    httpCode: 400,
    message: "This mode doesn't allowed",
}) {}

export class DecodeIdFailedError extends definePresentableError({
    code: 'DECODE_ID_FAILED',
    httpCode: 400,
    message: 'The ID is incorrect.',
}) {}

export class IncorrectDatasetIdHeaderError extends definePresentableError({
    code: 'INCORRECT_DATASET_ID_HEADER',
    httpCode: 400,
    message: 'Dataset id header is incorrect',
}) {}

export class IncorrectWorkbookIdHeaderError extends definePresentableError({
    code: 'INCORRECT_WORKBOOK_ID_HEADER',
    httpCode: 400,
    message: 'Workbook id header is incorrect',
}) {}

export class QuerySelectIsRequiredError extends definePresentableError({
    code: 'QUERY_SELECT_IS_REQUIRED_ERROR',
    httpCode: 500,
    message: 'The query requires select statement',
}) {}

export class PrivateRouteOnlyError extends definePresentableError({
    code: 'PRIVATE_ROUTE_ONLY',
    httpCode: 500,
    message: 'This route is private',
}) {}

export class ActionTimeoutError extends definePresentableError({
    code: 'ACTION_TIMEOUT',
    httpCode: 504,
    message: 'Action timed out',
}) {}
