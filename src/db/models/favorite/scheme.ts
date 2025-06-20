import compileSchema from '../../../components/validation-schema-compiler';

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
