import compileSchema from '../../../components/validation-schema-compiler';
import {
    AJV_PATTERN_KEYS_NOT_OBJECT,
    COMPARISON_OPERATORS,
    INTER_TENANT_GET_ENTRIES_SCHEMA,
} from '../../../const';

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
