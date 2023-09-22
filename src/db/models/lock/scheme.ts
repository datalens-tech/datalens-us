import compileSchema from '../../../components/validation-schema-compiler';

export const validateVerifyExistenceEntry = compileSchema({
    type: 'object',
    required: ['entryId'],
    properties: {
        entryId: {
            type: 'string',
        },
    },
});
export const validateLockEntry = compileSchema({
    type: 'object',
    required: ['entryId', 'duration'],
    properties: {
        entryId: {
            type: 'string',
        },
        duration: {
            type: 'integer',
        },
        force: {
            type: 'boolean',
        },
    },
});
export const validateUnlockEntry = compileSchema({
    type: 'object',
    required: ['entryId'],
    properties: {
        entryId: {
            type: 'string',
        },
        lockToken: {
            type: 'string',
        },
        force: {
            type: 'boolean',
        },
    },
});
export const validateExtendLockEntry = compileSchema({
    type: 'object',
    required: ['entryId'],
    properties: {
        entryId: {
            type: 'string',
        },
        duration: {
            type: 'integer',
        },
        lockToken: {
            type: 'string',
        },
        force: {
            type: 'boolean',
        },
    },
});
