// In theory DBError should be taken from the Objection.js (https://vincit.github.io/objection.js/recipes/error-handling.html#error-handling)
// However the types described there are incorrect: const DBError: typeof dbErrors.DBError;
// Due to incorrect types Typescript casts DBError as a constant.
// DBError cannot be used as a type and typeof DBError does not infer the original type
import {AppError} from '@gravity-ui/nodekit';
import {DBError} from 'db-errors';

import {US_ERRORS} from '../const/errors';

import {PresentableError} from './errors';

const PG_ERRORS = require('pg-error-constants');

function getDBErrorCode(error: DBError): string {
    const nativeError = error.nativeError as Error & {code?: string};
    return nativeError?.code || '';
}

function getApiErrorMessage(message: string, code: string, defaultMessage?: string) {
    const returningDefaultMessage = defaultMessage || message;

    return message === code ? returningDefaultMessage : message;
}

// eslint-disable-next-line complexity
export default (error: AppError | DBError) => {
    if (error instanceof PresentableError) {
        return error.present();
    }

    if (error instanceof DBError) {
        const dbCode = getDBErrorCode(error);
        switch (dbCode) {
            case PG_ERRORS.UNIQUE_VIOLATION: {
                return {
                    code: 400,
                    response: {
                        code: US_ERRORS.DB_UNIQUE_VIOLATION,
                        message: 'The entity already exists',
                    },
                };
            }
            case PG_ERRORS.NUMERIC_VALUE_OUT_OF_RANGE: {
                return {
                    code: 400,
                    response: {
                        message: 'Wrong passed entryId (it can be in links)',
                    },
                };
            }
            default:
                return {
                    code: 500,
                    response: {
                        message: 'Database error',
                    },
                };
        }
    }

    const {code, message, details} = error as AppError;

    switch (code) {
        case US_ERRORS.MODE_NOT_ALLOWED:
        case US_ERRORS.DECODE_ID_FAILED:
        case US_ERRORS.VALIDATION_ERROR:
        case US_ERRORS.COMPUTE_ENTRIES_FEATURE_DISABLED:
        case US_ERRORS.COMPUTE_ENTRY_INVALID_TYPE:
        case US_ERRORS.COMPUTE_ENTRY_TYPE_CHANGE_FORBIDDEN:
        case US_ERRORS.TENANT_IS_BEING_DELETED: {
            return {
                code: 400,
                response: {
                    code,
                    message,
                    details,
                },
            };
        }
        case US_ERRORS.DLS_FORBIDDEN: {
            return {
                code: 403,
                response: {
                    code,
                    message,
                    details,
                },
            };
        }
        case US_ERRORS.NOT_VALID_MASTER_TOKEN: {
            return {
                code: 403,
                response: {
                    code,
                    message: "Master token isn't valid",
                },
            };
        }
        case US_ERRORS.NOT_EXIST_DRAFT: {
            return {
                code: 404,
                response: {
                    code,
                    message: "The draft doesn't exist",
                },
            };
        }

        case US_ERRORS.NOT_EXIST_CONFIG: {
            return {
                code: 404,
                response: {
                    code,
                    message: 'Not exists config with this template name',
                },
            };
        }
        case US_ERRORS.TEMPLATE_NOT_EXISTS: {
            return {
                code: 404,
                response: {
                    code,
                    message: "A template with this name doesn't exist",
                },
            };
        }

        case US_ERRORS.NOT_EXIST_STATE_BY_HASH: {
            return {
                code: 404,
                response: {
                    code,
                    message: "The state by this hash has doesn't exist",
                },
            };
        }

        case US_ERRORS.NOT_EXIST_TENANT: {
            return {
                code: 404,
                response: {
                    code,
                    message: "The specified tenant doesn't exist",
                },
            };
        }

        case US_ERRORS.NOT_EXIST_REVISION: {
            return {
                code: 404,
                response: {
                    code,
                    message: "The revision doesn't exist",
                },
            };
        }

        case US_ERRORS.NOT_MATCH_TOGETHER: {
            return {
                code: 409,
                response: {
                    message: 'Not correct folderId',
                },
            };
        }

        case US_ERRORS.WORKBOOK_TEMPLATE_NOT_EXISTS: {
            return {
                code: 404,
                response: {
                    code,
                    message: "The workbook template doesn't exist",
                },
            };
        }
        case US_ERRORS.WORKBOOK_ALREADY_EXISTS: {
            return {
                code: 409,
                response: {
                    code,
                    message: 'The workbook already exists',
                },
            };
        }
        case US_ERRORS.WORKBOOK_NOT_EXISTS: {
            return {
                code: 404,
                response: {
                    code,
                    message: getApiErrorMessage(message, code, "The workbook doesn't exist"),
                    details,
                },
            };
        }
        case US_ERRORS.WORKBOOK_IS_ALREADY_RESTORED: {
            return {
                code: 400,
                response: {
                    code,
                    message: 'The workbook is already restored',
                },
            };
        }

        case US_ERRORS.WORKBOOK_COPY_FILE_CONNECTION_ERROR: {
            return {
                code: 400,
                response: {
                    code,
                    message: 'Copying workbooks with file connections is forbidden',
                },
            };
        }

        case US_ERRORS.TOO_MANY_COLOR_PALETTES: {
            return {
                code: 500,
                response: {
                    code,
                    message,
                    details,
                },
            };
        }
        case US_ERRORS.COLOR_PALETTE_NOT_EXISTS: {
            return {
                code: 404,
                response: {
                    code,
                    message: "The pallete doesn't exist",
                },
            };
        }

        case US_ERRORS.INCORRECT_DATASET_ID_HEADER: {
            return {
                code: 400,
                response: {
                    code,
                    message: 'Dataset id header is incorrect',
                },
            };
        }
        case US_ERRORS.INCORRECT_WORKBOOK_ID_HEADER: {
            return {
                code: 400,
                response: {
                    code,
                    message: 'Workbook id header is incorrect',
                },
            };
        }
        case US_ERRORS.WORKBOOK_ISOLATION_INTERRUPTION: {
            return {
                code: 403,
                response: {
                    code,
                    message: 'Workbook isolation interruption',
                },
            };
        }
        case US_ERRORS.WORKBOOK_TEMPLATE_CANT_BE_DELETED: {
            return {
                code: 403,
                response: {
                    code,
                    message: "Workbook template can't be deleted",
                },
            };
        }

        case US_ERRORS.TENANT_ID_MISSING_IN_CONTEXT: {
            return {
                code: 400,
                response: {
                    code,
                    message:
                        'TenantId is missing. Probably it needs to be passed in the request headers.',
                },
            };
        }

        case US_ERRORS.ACTION_TIMEOUT: {
            return {
                code: 504,
                response: {
                    code,
                    message: 'Action timed out',
                },
            };
        }

        case US_ERRORS.FAVORITE_NOT_EXISTS: {
            return {
                code: 404,
                response: {
                    code,
                    message: "The favorite doesn't exist",
                },
            };
        }

        case US_ERRORS.QUERY_SELECT_IS_REQUIRED_ERROR: {
            return {
                code: 500,
                response: {
                    code,
                    message,
                },
            };
        }

        case US_ERRORS.PRIVATE_ROUTE_ONLY: {
            return {
                code: 500,
                response: {
                    code,
                    message,
                },
            };
        }

        default:
            return {
                code: 500,
                response: {
                    message: 'Internal Server Error',
                },
            };
    }
};
