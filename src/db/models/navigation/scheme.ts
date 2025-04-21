import compileSchema from '../../../components/validation-schema-compiler';
import {
    AJV_PATTERN_KEYS_NOT_OBJECT,
    COMPARISON_OPERATORS,
    INTER_TENANT_GET_ENTRIES_SCHEMA,
} from '../../../const';

export const validateGetEntries = compileSchema({
    type: 'object',
    required: ['tenantId'],
    properties: {
        tenantId: {
            type: 'string',
        },
        scope: {
            type: 'string',
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
        metaFilters: {
            type: 'object',
            patternProperties: AJV_PATTERN_KEYS_NOT_OBJECT,
        },
        filters: {
            type: 'object',
            patternProperties: AJV_PATTERN_KEYS_NOT_OBJECT,
        },
        orderBy: {
            type: 'object',
            required: ['field', 'direction'],
            properties: {
                field: {
                    type: 'string',
                    enum: ['createdAt', 'name'],
                },
                direction: {
                    type: 'string',
                    enum: ['asc', 'desc'],
                },
            },
        },
        page: {
            type: 'integer',
            minimum: 0,
        },
        pageSize: {
            type: 'integer',
            minimum: 1,
            maximum: 200,
        },
        includePermissionsInfo: {
            type: 'boolean',
        },
        ignoreWorkbookEntries: {
            type: 'boolean',
        },
        includeData: {
            type: 'boolean',
        },
        includeLinks: {
            type: 'boolean',
        },
    },
    anyOf: [
        {
            required: ['scope'],
        },
        {
            required: ['ids'],
        },
    ],
});

export const validateInterTenantGetEntries = compileSchema({
    type: 'object',
    required: ['scope'],
    properties: {
        ...INTER_TENANT_GET_ENTRIES_SCHEMA,
        orderBy: {
            type: 'string',
            enum: ['asc', 'desc'],
        },
        page: {
            type: 'integer',
            minimum: 0,
        },
        pageSize: {
            type: 'integer',
            minimum: 1,
            maximum: 200,
        },
        creationTimeFilters: {
            type: 'object',
            patternProperties: AJV_PATTERN_KEYS_NOT_OBJECT,
            propertyNames: {
                enum: [...Object.keys(COMPARISON_OPERATORS)],
            },
        },
    },
});

export const validateFind = compileSchema({
    type: 'object',
    required: ['tenantId', 'text'],
    properties: {
        tenantId: {
            type: 'string',
        },
        text: {
            type: 'string',
        },
    },
});
