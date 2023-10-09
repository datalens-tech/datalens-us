import compileSchema from '../../../components/validation-schema-compiler';
import {AJV_PATTERN_KEYS_NOT_OBJECT, COMPARISON_OPERATORS} from '../../../const';

export const validateGetEntries = compileSchema({
    type: 'object',
    required: ['tenantId', 'scope'],
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
                    enum: ['updatedAt', 'createdAt', 'name'],
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
});

export const validateInterTenantGetEntries = compileSchema({
    type: 'object',
    required: ['scope'],
    properties: {
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
        metaFilters: {
            type: 'object',
            patternProperties: AJV_PATTERN_KEYS_NOT_OBJECT,
        },
        creationTimeFilters: {
            type: 'object',
            patternProperties: AJV_PATTERN_KEYS_NOT_OBJECT,
            propertyNames: {
                enum: [...Object.keys(COMPARISON_OPERATORS)],
            },
        },
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
