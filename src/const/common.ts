export const TRUE_FLAGS = ['1', 'true', true];

export const ALL_COLUMNS = [
    'entries.entryId',
    'scope',
    'type',
    'key',
    'displayKey',
    'unversionedData',
    'tenantId',
    'entries.createdBy',
    'entries.createdAt',
    'revisions.updatedBy',
    'revisions.updatedAt',
    'savedId',
    'publishedId',
    'revId',
    'data',
    'meta',
    'innerMeta',
    'hidden',
    'mirrored',
    'links',
    'workbookId',
];

export const RETURN_COLUMNS = [
    'entries.entryId',
    'scope',
    'type',
    'display_key as key',
    'unversionedData',
    'entries.createdBy',
    'entries.createdAt',
    'revisions.updatedBy',
    'revisions.updatedAt',
    'savedId',
    'publishedId',
    'revId',
    'entries.tenantId',
    'data',
    'meta',
    'hidden',
    'mirrored',
    'public',
    'workbookId',
];

export const RETURN_META_COLUMNS = [
    'entries.entryId',
    'scope',
    'type',
    'display_key as key',
    'meta',
    'savedId',
    'publishedId',
    'tenantId',
    'workbookId',
];

export const RETURN_RELATION_COLUMNS = [
    'entries.entryId',
    'scope',
    'type',
    'display_key as key',
    'meta',
    'depth',
    'tenantId',
    'public',
    'workbookId',
];

export const RETURN_NAVIGATION_COLUMNS = [
    'entries.entryId',
    'scope',
    'type',
    'display_key as key',
    'revisions.meta',
    'entries.createdBy',
    'entries.createdAt',
    'revisions.updatedBy',
    'revisions.updatedAt',
    'savedId',
    'publishedId',
    'hidden',
    'entries.workbookId',
];

export const RETURN_FAVORITES_COLUMNS = [
    'favorites.alias',
    'favorites.display_alias',
    'entries.entryId',
    'entries.scope',
    'entries.type',
    'entries.display_key as key',
    'entries.created_by',
    'entries.updated_at',
    'entries.created_at',
    'workbooks.title as workbookTitle',
    'hidden',
    'entries.workbookId',
];

export const RETURN_WORKBOOK_COLUMNS = [
    'workbookId',
    'title',
    'description',
    'projectId',
    'tenantId',
    'meta',
    'createdBy',
    'createdAt',
];

export const ALLOWED_SCOPE_VALUES = [
    'dataset',
    'pdf',
    'folder',
    'dash',
    'connection',
    'widget',
    'config',
];

export const ID_VARIABLES = [
    'ids',
    'entryId',
    'entryIds',
    'oldEntryId',
    'revId',
    'draftId',
    'savedId',
    'publishedId',
    'lockId',
    'workbookId',
    'presetId',
    'collectionId',
    'parentId',
    'colorPaletteId',
    'revIds',
    'embeddingSecretId',
    'embedId',
];

export const CODING_BASE = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
export const MAX_META_OBJECT_SYMBOLS = 2000;
export const MAX_UNVERSIONED_DATA_OBJECT_SYMBOLS = 5000;
export const MAX_PRESET_DATA_OBJECT_SYMBOLS = 15000;
export const MAX_BRANDING_OBJECT_SYMBOLS = 15000;

export const AJV_PATTERN_KEYS_NOT_OBJECT = {
    '.*': {
        not: {
            type: 'object',
        },
    },
};

export const US_MASTER_TOKEN_HEADER = 'x-us-master-token';
export const DL_COMPONENT_HEADER = 'x-dl-component';
export const DL_WORKBOOK_ID_HEADER = 'x-dl-workbookid';
export const DL_SERVICE_USER_ACCESS_TOKEN = 'x-dl-service-user-access-token';
export const DL_AUTH_HEADER_KEY = 'bearer';

export const COMPARISON_OPERATORS: {[key: string]: string} = {
    eq: '=',
    ne: '<>',
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
};

export enum BiTrackingLogs {
    CreateEntry = 'CREATE_ENTRY_SUCCESS',
    PrivateCreateEntry = 'PRIVATE_CREATE_ENTRY_SUCCESS',
    UpdateEntry = 'UPDATE_ENTRY_SUCCESS',
    RenameEntry = 'RENAME_ENTRY_SUCCESS',
    MoveEntry = 'MOVE_ENTRY_SUCCESS',
    CopyEntry = 'COPY_ENTRY_SUCCESS',
    DeleteEntry = 'DELETE_ENTRY_SUCCESS',
}

export const DEFAULT_QUERY_TIMEOUT = 20000;
export const EXTENDED_QUERY_TIMEOUT = 40000;

export const TRASH_FOLDER = '__trash';

export const ORG_TENANT_PREFIX = 'org_';

export const DEFAULT_PAGE_SIZE = 1000;

export const DEFAULT_PAGE = 0;

export const CURRENT_TIMESTAMP = 'CURRENT_TIMESTAMP';

export enum AppInstallation {
    Opensource = 'opensource',
}

export enum AppEnv {
    IntTesting = 'int-testing',
    Development = 'development',
    Preprod = 'preprod',
    Prod = 'prod',
}

export const COPY_START = '(COPY';
export const COPY_END = ')';
