import compileSchema from '../../../components/validation-schema-compiler';

const TEMPLATE_DATA_SCHEMA = {
    type: 'object',
    required: ['templatePath', 'defaultTargetPath'],
    properties: {
        templatePath: {
            type: 'string',
        },
        defaultTargetPath: {
            type: 'string',
        },
    },
};

export const validateGet = compileSchema({
    type: 'object',
    required: ['name'],
    properties: {
        name: {
            type: 'string',
        },
    },
});

export const validateCreate = compileSchema({
    type: 'object',
    required: ['name', 'data'],
    properties: {
        name: {
            type: 'string',
        },
        data: TEMPLATE_DATA_SCHEMA,
    },
});

export const validateUpdate = compileSchema({
    type: 'object',
    required: ['name', 'data'],
    properties: {
        name: {
            type: 'string',
        },
        data: TEMPLATE_DATA_SCHEMA,
    },
});

export const validateDelete = compileSchema({
    type: 'object',
    required: ['name'],
    properties: {
        name: {
            type: 'string',
        },
    },
});
