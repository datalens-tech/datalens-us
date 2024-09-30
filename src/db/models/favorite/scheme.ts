import compileSchema, {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {AJV_PATTERN_KEYS_NOT_OBJECT} from '../../../const';

export const validateGetFavorites = compileSchema({
    type: 'object',
    required: ['tenantId', 'login'],
    properties: {
        tenantId: {
            type: 'string',
        },
        login: {
            type: 'string',
        },
        includePermissionsInfo: {
            type: 'boolean',
        },
        ignoreWorkbookEntries: {
            type: 'boolean',
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
        scope: {
            type: ['array', 'string'],
        },
    },
});
export const validateAddFavorite = compileSchema({
    type: 'object',
    required: ['tenantId', 'entryId', 'login'],
    properties: {
        tenantId: {
            type: 'string',
        },
        entryId: {
            type: 'string',
        },
        login: {
            type: 'string',
        },
    },
});
export const validateDeleteFavorite = compileSchema({
    type: 'object',
    required: ['entryId', 'login'],
    properties: {
        entryId: {
            type: 'string',
        },
        login: {
            type: 'string',
        },
    },
});
export const validateRenameFavorite = makeSchemaValidator({
    type: 'object',
    required: ['entryId', 'name'],
    properties: {
        entryId: {
            type: 'string',
        },
        name: {
            type: ['string', 'null'],
            verifyEntryName: true,
        },
    },
});
