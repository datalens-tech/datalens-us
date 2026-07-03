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

        case US_ERRORS.FAVORITE_NOT_EXISTS: {
            return {
                code: 404,
                response: {
                    code,
                    message: "The favorite doesn't exist",
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
