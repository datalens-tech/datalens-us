import {EntryScope} from '../db/models/new/entry/types';
import {Mode} from '../types/models';

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
    'annotation',
    'innerMeta',
    'hidden',
    'mirrored',
    'links',
    'workbookId',
    'collectionId',
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
    'annotation',
    'hidden',
    'mirrored',
    'public',
    'workbookId',
    'collectionId',
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
    'collectionId',
];

export const RETURN_RELATION_COLUMNS = [
    'entries.entryId',
    'scope',
    'type',
    'display_key as key',
    'meta',
    'annotation',
    'tenantId',
    'public',
    'workbookId',
    'collectionId',
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
    'revisions.annotation',
    'savedId',
    'publishedId',
    'hidden',
    'entries.workbookId',
    'entries.collectionId',
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
    'entries.collectionId',
];

export const RETURN_WORKBOOK_COLUMNS = [
    'workbookId',
    'title',
    'description',
    'tenantId',
    'meta',
    'createdBy',
    'createdAt',
];

export const ALLOWED_SCOPE_VALUES = Object.values(EntryScope);

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
    'workbookIds',
    'presetId',
    'collectionId',
    'collectionIds',
    'parentId',
    'colorPaletteId',
    'revIds',
    'embeddingSecretId',
    'embedId',
];

export const CODING_BASE = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
export const ENCODED_ID_LENGTH = 13;

export const MAX_META_OBJECT_SYMBOLS = 2000;
export const MAX_UNVERSIONED_DATA_OBJECT_SYMBOLS = 5000;
export const MAX_BRANDING_OBJECT_SYMBOLS = 15000;
export const MAX_STATE_DATA_OBJECT_SYMBOLS = 50000;

export const AJV_PATTERN_KEYS_NOT_OBJECT = {
    '.*': {
        not: {
            type: 'object',
        },
    },
};

export const COOKIE_HEADER = 'cookie';
export const AUTHORIZATION_HEADER = 'authorization';
export const DL_AUTH_HEADER_KEY = 'bearer';

export const US_MASTER_TOKEN_HEADER = 'x-us-master-token';
export const DL_COMPONENT_HEADER = 'x-dl-component';
export const DL_WORKBOOK_ID_HEADER = 'x-dl-workbookid';
export const DL_DATASET_ID_HEADER = 'x-dl-datasetid';
export const DL_SERVICE_USER_ACCESS_TOKEN = 'x-dl-service-user-access-token';

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

export const APP_NAME = 'united-storage';

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

export const INTER_TENANT_GET_ENTRIES_SCHEMA = {
    scope: {
        type: 'string',
        enum: ['dataset', 'connection', 'config', 'widget', 'dash'],
    },
    ids: {
        type: ['string', 'array'],
    },
    type: {
        type: 'string',
    },
    createdBy: {
        oneOf: [
            {type: 'string'},
            {
                type: 'array',
                items: {type: 'string'},
            },
        ],
    },
    meta: {
        type: 'object',
        patternProperties: AJV_PATTERN_KEYS_NOT_OBJECT,
    },
};

export const ModeValues: Mode[] = ['save', 'publish'];

export const ALLOWED_ENTRIES_SCOPE = [
    EntryScope.Dash,
    EntryScope.Widget,
    EntryScope.Dataset,
    EntryScope.Connection,
    EntryScope.Report,
] as const;

export const CONTENT_TYPE_JSON = 'application/json';

export const ANNOTATION_DESCRIPTION_MAX_LENGTH = 36000;

export const ANNOTATION_DESCRIPTION_SCHEMA = {
    type: 'string',
    maxLength: ANNOTATION_DESCRIPTION_MAX_LENGTH,
};

export const ANNOTATION_SCHEMA = {
    type: ['object'],
    required: ['description'],
    additionalProperties: false,
    properties: {
        description: ANNOTATION_DESCRIPTION_SCHEMA,
    },
};
