import compileSchema from '../../../components/validation-schema-compiler';

export const validateGet = compileSchema({
    type: 'object',
    required: ['tenantId'],
    properties: {
        tenantId: {
            type: 'string',
        },
    },
});
