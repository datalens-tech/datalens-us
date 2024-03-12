// In theory DBError should be taken from the Objection.js (https://vincit.github.io/objection.js/recipes/error-handling.html#error-handling)
// However the types described there are incorrect: const DBError: typeof dbErrors.DBError;
// Due to incorrect types Typescript casts DBError as a constant.
// DBError cannot be used as a type and typeof DBError does not infer the original type
import {DBError} from 'db-errors';
import {AppError} from '@gravity-ui/nodekit';
import US_ERRORS from '../const/us-error-constants';
const PG_ERRORS = require('pg-error-constants');

function getDBErrorCode(error: DBError): string {
    const nativeError = error.nativeError as Error & {code?: string};
    return nativeError?.code || '';
}

// eslint-disable-next-line complexity
export default (error: AppError | DBError) => {
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

    const {code, message, details, debug} = error as AppError;

    switch (code) {
        case US_ERRORS.COLLECTIONS_ALREADY_ENABLED: {
            return {
                code: 400,
                response: {
                    message: 'Collections alredy enabled',
                },
            };
        }
        case US_ERRORS.DURATION_IS_LIMITED:
        case US_ERRORS.TENANTS_PER_CLOUD_QUOTA_EXCEEDED:
        case US_ERRORS.LOCK_TOKEN_REQUIRED: {
            return {
                code: 400,
                response: {
                    message,
                },
            };
        }
        case US_ERRORS.FOLDER_ALREADY_EXIST_IN_TENANT:
        case US_ERRORS.FOLDER_MOVE_FILE_CONNECTION_ERROR:
        case US_ERRORS.ENTRY_IS_ALREADY_IN_WORKBOOK:
        case US_ERRORS.ENTRY_IS_NOT_IN_WORKBOOK:
        case US_ERRORS.FOLDER_DESTINATION_NOT_EXIST:
        case US_ERRORS.PARENT_FOLDER_NOT_EXIST:
        case US_ERRORS.MODE_NOT_ALLOWED:
        case US_ERRORS.CURRENT_TENANT_IS_NOT_MASTER:
        case US_ERRORS.DECODE_ID_FAILED:
        case US_ERRORS.USER_SETTINGS_NOT_EXISTS:
        case US_ERRORS.TENANT_IS_BEING_DELETED:
        case US_ERRORS.VALIDATION_ERROR: {
            return {
                code: 400,
                response: {
                    code,
                    message,
                    details,
                },
            };
        }
        case US_ERRORS.ENTRIES_WITH_INSUFFICIENT_PERMISSIONS: {
            return {
                code: 403,
                response: {
                    message:
                        "You can't do this action because of you don't have enough permissions for some entries",
                },
            };
        }
        case US_ERRORS.WORKBOOK_OPERATION_FORBIDDEN:
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
                    message: "Master token isn't valid",
                },
            };
        }
        case US_ERRORS.NOT_EXIST_LOCKED_ENTRY: {
            return {
                code: 404,
                response: {
                    message: "The entity isn't locked",
                },
            };
        }
        case US_ERRORS.DLS_NOT_EXIST_ENTRY: {
            return {
                code: 404,
                response: {
                    dlsResponse: message,
                },
            };
        }
        case US_ERRORS.NOT_EXIST_TEMPLATE_FOLDER: {
            return {
                code: 404,
                response: {
                    message: 'Not exists template folder',
                },
            };
        }
        case US_ERRORS.NOT_EXIST_DRAFT: {
            return {
                code: 404,
                response: {
                    message: "The draft doesn't exist",
                },
            };
        }
        case US_ERRORS.NOT_FOUND_COMMENT: {
            return {
                code: 404,
                response: {
                    message: "The comment wasn't found",
                },
            };
        }
        case US_ERRORS.NOT_EXIST_CONFIG: {
            return {
                code: 404,
                response: {
                    message: 'Not exists config with this template name',
                },
            };
        }
        case US_ERRORS.TEMPLATE_NOT_EXISTS: {
            return {
                code: 404,
                response: {
                    message: "A template with this name doesn't exist",
                },
            };
        }

        case US_ERRORS.NOT_EXIST_DELETED_ENTRY:
        case US_ERRORS.NOT_EXIST_ENTRY: {
            return {
                code: 404,
                response: {
                    message: "The entity doesn't exist",
                },
            };
        }
        case US_ERRORS.FOLDER_COPY_DENIED: {
            return {
                code: 403,
                response: {
                    message: 'Folders cannot be copied',
                },
            };
        }
        case US_ERRORS.CONNECTION_COPY_DENIED: {
            return {
                code: 403,
                response: {
                    message: 'Connections cannot be copied',
                },
            };
        }
        case US_ERRORS.NOT_EXIST_STATE_BY_HASH: {
            return {
                code: 404,
                response: {
                    message: "The state by this hash has doesn't exist",
                },
            };
        }
        case US_ERRORS.NOT_EXIST_FOLDER: {
            return {
                code: 404,
                response: {
                    message: "The folder doesn't exist",
                },
            };
        }
        case US_ERRORS.NOT_EXIST_TENANT: {
            return {
                code: 404,
                response: {
                    message: "The specified tenant doesn't exist",
                },
            };
        }
        case US_ERRORS.NOT_EXIST_SERVICE_INSTANCE: {
            return {
                code: 404,
                response: {
                    message: "The service instance doesn't exist",
                },
            };
        }
        case US_ERRORS.NOT_EXIST_REVISION: {
            return {
                code: 404,
                response: {
                    message: "The revision doesn't exist",
                },
            };
        }
        case US_ERRORS.DLS_METHOD_NOT_IMPLEMENTED: {
            return {
                code: 405,
                response: {},
            };
        }
        case US_ERRORS.SCOPE_NOT_ALLOWED: {
            return {
                code: 405,
                response: {
                    message: 'The scope not allowed',
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
        case US_ERRORS.EXIST_ENTRY_WITH_THIS_KEY: {
            return {
                code: 409,
                response: {
                    message,
                },
            };
        }
        case US_ERRORS.ENTRY_ALREADY_EXISTS: {
            return {
                code: 409,
                response: {
                    code,
                    message: 'The entry already exists',
                    details,
                },
            };
        }
        case US_ERRORS.ENTRY_IS_LOCKED: {
            return {
                code: 423,
                response: {
                    code,
                    message: 'The entry is locked',
                    details,
                    debug,
                },
            };
        }
        case US_ERRORS.ENTRY_LOCK_FORCE_CONFLICT: {
            return {
                code: 409,
                response: {
                    code,
                    message: 'Conflict occurred while setting a forced lock',
                    details,
                },
            };
        }
        case US_ERRORS.NOT_EXIST_TEMPLATES_CONFIG: {
            return {
                code: 500,
                response: {
                    message: 'Not found templates config on server',
                },
            };
        }
        case US_ERRORS.NOT_EXIST_BILLING_INSTANCE_SERVICE_ID_PREFIX_IN_CONFIG: {
            return {
                code: 500,
                response: {
                    message: 'Not found billingInstanceServiceIdPrefix in config',
                },
            };
        }
        case US_ERRORS.DLS_ADD_ENTITY_ERROR:
        case US_ERRORS.DLS_CHECK_BULK_PERMISSION_ERROR:
        case US_ERRORS.DLS_CHECK_PERMISSION_ERROR: {
            return {
                code: 530,
                response: {
                    type: 'dls_error',
                },
            };
        }
        case US_ERRORS.ACCESS_SERVICE_CHECK_PERMISSION_ERROR: {
            return {
                code: 530,
                response: {
                    type: 'access_service_error',
                },
            };
        }
        case US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED: {
            return {
                code: 403,
                response: {
                    message: 'Auth denied',
                    code,
                },
            };
        }
        case US_ERRORS.ACCESS_SERVICE_UNAUTHENTICATED: {
            return {
                code: 401,
                response: {
                    message: 'Unauthenticated',
                    code,
                },
            };
        }
        case US_ERRORS.BILLING_SERVICE_ACCOUNT_UNAUTHENTICATED: {
            return {
                code: 401,
                response: {
                    message: 'Unauthenticated',
                    code,
                },
            };
        }
        case US_ERRORS.DLS_MODIFY_PERMISSIONS_BAD_REQUEST: {
            return {
                code: 400,
                response: {
                    message: 'Bad Request',
                    code,
                },
            };
        }

        case US_ERRORS.DLS_GET_SUGGEST_FAILED:
        case US_ERRORS.DLS_MODIFY_PERMISSIONS_FAILED:
        case US_ERRORS.DLS_GET_PERMISSIONS_FAILED:
        case US_ERRORS.DLS_ADD_ENTITY_FAILED:
        case US_ERRORS.DLS_CHECK_BULK_PERMISSION_FAILED:
        case US_ERRORS.DLS_CHECK_PERMISSION_FAILED: {
            return {
                code: 530,
                response: {
                    code,
                    message,
                },
            };
        }
        case US_ERRORS.NOT_EXIST_PRESET: {
            return {
                code: 404,
                response: {
                    message: "The preset doesn't exist",
                },
            };
        }
        case US_ERRORS.WORKBOOK_TEMPLATE_NOT_EXISTS: {
            return {
                code: 404,
                response: {
                    message: "The workbook template doesn't exist",
                },
            };
        }
        case US_ERRORS.ENTRY_WITHOUT_WORKBOOK_ID_COPY_DENIED: {
            return {
                code: 403,
                response: {
                    message: 'Entry without workbookId, cannot be copied to workbook',
                },
            };
        }
        case US_ERRORS.ENTRIES_WITH_DIFFERENT_WORKBOOK_IDS_COPY_DENIED: {
            return {
                code: 403,
                response: {
                    message: 'Entry with different workbookIds, cannot be copy denied',
                },
            };
        }
        case US_ERRORS.INIT_TENANT_MIGRATING: {
            return {
                code: 409,
                response: {
                    code,
                    message: "The tenant can't be created because it's in the process of migration",
                },
            };
        }
        case US_ERRORS.MIGRATION_DENIED: {
            return {
                code: 403,
                response: {
                    code,
                    message: 'Migration denied',
                },
            };
        }
        case US_ERRORS.MIGRATION_ORG_EXISTS: {
            return {
                code: 409,
                response: {
                    code,
                    message: 'The migration organization already exists',
                },
            };
        }
        case US_ERRORS.COLLECTION_ALREADY_EXISTS: {
            return {
                code: 409,
                response: {
                    message: 'The collection already exists',
                },
            };
        }
        case US_ERRORS.COLLECTION_CIRCULAR_REFERENCE_ERROR: {
            return {
                code: 409,
                response: {
                    message: message ?? 'Circular reference error between collections',
                },
            };
        }
        case US_ERRORS.WORKBOOK_ALREADY_EXISTS: {
            return {
                code: 409,
                response: {
                    message: 'The workbook already exists',
                },
            };
        }
        case US_ERRORS.COLLECTION_NOT_EXISTS: {
            return {
                code: 404,
                response: {
                    message: "The collection doesn't exist",
                },
            };
        }
        case US_ERRORS.WORKBOOK_NOT_EXISTS: {
            return {
                code: 404,
                response: {
                    message: "The workbook doesn't exist",
                },
            };
        }
        case US_ERRORS.WORKBOOK_IS_ALREADY_RESTORED: {
            return {
                code: 400,
                response: {
                    message: 'The workbook is alredy restored',
                },
            };
        }
        case US_ERRORS.WORKBOOK_ENTITY_ERROR: {
            return {
                code: 500,
                response: {
                    message: message ?? 'Workbook entity error',
                },
            };
        }
        case US_ERRORS.WORKBOOK_COPY_FILE_CONNECTION_ERROR: {
            return {
                code: 400,
                response: {
                    message: 'Copying workbooks with file connections is forbidden',
                },
            };
        }
        case US_ERRORS.SERVICE_ACCOUNT_ERROR: {
            return {
                code: 500,
                response: {
                    message: message ?? 'Service account error',
                },
            };
        }
        case US_ERRORS.ACCESS_SERVICE_ERROR: {
            return {
                code: 500,
                response: {
                    message: message ?? 'Access service error',
                },
            };
        }
        case US_ERRORS.ACCESS_BINDINGS_SERVICE_ERROR: {
            return {
                code: 500,
                response: {
                    message: message ?? 'Access bindings service error',
                },
            };
        }
        case US_ERRORS.NOT_ORG_INSTANCE_ERROR: {
            return {
                code: 500,
                response: {
                    message: message ?? 'The action is only available in an organization instance',
                },
            };
        }
        case US_ERRORS.INCORRECT_INSTALLATION_ERROR: {
            return {
                code: 500,
                response: {
                    message: message ?? 'Incorrect installation',
                },
            };
        }
        case US_ERRORS.TOO_MANY_COLOR_PALETTES: {
            return {
                code: 500,
                response: {
                    message,
                    details,
                },
            };
        }
        case US_ERRORS.COLOR_PALETTE_NOT_EXISTS: {
            return {
                code: 404,
                response: {
                    message: "The pallete doesn't exist",
                },
            };
        }

        case US_ERRORS.SWITCH_PUBLICATION_INCORRECT_WORKBOOK_ID:
        case US_ERRORS.SWITCH_PUBLICATION_INCORRECT_MAIN_ENTRY: {
            return {
                code: 500,
                response: {
                    message,
                    details,
                },
            };
        }
        case US_ERRORS.MODIFY_USERS_FOLDER_DENIED: {
            return {
                code: 403,
                response: {
                    message,
                },
            };
        }
        case US_ERRORS.CIRCULAR_REFERENCE_ERROR: {
            return {
                code: 409,
                response: {
                    message: 'Circular reference error',
                },
            };
        }
        case US_ERRORS.EMBEDDING_SECRET_NOT_EXISTS: {
            return {
                code: 404,
                response: {
                    code,
                    message: "The embedding secret doesn't exist",
                },
            };
        }
        case US_ERRORS.EMBED_NOT_EXISTS: {
            return {
                code: 404,
                response: {
                    code,
                    message: "The embed doesn't exist",
                },
            };
        }
        case US_ERRORS.INCORRECT_DEPS_IDS_FOR_EMBED: {
            return {
                code: 409,
                response: {
                    code,
                    message: 'Incorrect dependencies for embed',
                },
            };
        }
        case US_ERRORS.INCORRECT_ENTRY_ID_FOR_EMBED: {
            return {
                code: 409,
                response: {
                    code,
                    message: 'Incorrect entryId for embed',
                },
            };
        }
        case US_ERRORS.EMBEDDING_INFO_IS_EMPTY: {
            return {
                code: 500,
                response: {
                    code,
                    message: 'Embedding info is empty',
                },
            };
        }
        case US_ERRORS.UNKNOWN_OPERATION_TYPE: {
            return {
                code: 400,
                response: {
                    code,
                    message: 'Unknown operation type',
                },
            };
        }
        case US_ERRORS.IAM_OPERATION_NOT_EXISTS: {
            return {
                code: 404,
                response: {
                    code,
                    message: "IAM operation doesn't exist",
                },
            };
        }
        case US_ERRORS.MOVE_TENANT_CONTENT_DENIED: {
            return {
                code: 403,
                response: {
                    code,
                    message: message ?? 'Move tenant content denied',
                },
            };
        }
        case US_ERRORS.MOVE_TENANT_CONTENT_ERROR: {
            return {
                code: 500,
                response: {
                    code,
                    message: message ?? 'Move tenant content error',
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
        case US_ERRORS.COLLECTION_WITH_WORKBOOK_TEMPLATE_CANT_BE_DELETED: {
            return {
                code: 403,
                response: {
                    code,
                    message: "Collection with workbook template can't be deleted",
                },
            };
        }
        case US_ERRORS.WORKBOOK_ID_IS_NOT_SET_FOR_TEMPLATE: {
            return {
                code: 500,
                response: {
                    code,
                    message: 'Workbook id is not set for template',
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
