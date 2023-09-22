import {makeSchemaValidator} from '../../../../components/validation-schema-compiler';

export const validateTenantId = makeSchemaValidator({
    type: 'object',
    required: ['tenantId'],
    properties: {
        tenantId: {
            type: 'string',
        },
    },
});
