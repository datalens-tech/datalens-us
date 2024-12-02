import compileSchema from '../../../components/validation-schema-compiler';
import {AJV_PATTERN_KEYS_NOT_OBJECT, ALLOWED_SCOPE_VALUES, ModeValues} from '../../../const';

export const validateCreateEntry = compileSchema({
    type: 'object',
    required: ['key', 'tenantId', 'scope', 'createdBy'],
    properties: {
        tenantId: {
            type: 'string',
        },
        scope: {
            type: 'string',
            enum: ALLOWED_SCOPE_VALUES,
        },
        type: {
            type: 'string',
        },
        key: {
            type: 'string',
            verifyEntryKey: true,
        },
        meta: {
            type: ['object', 'null'],
            patternProperties: AJV_PATTERN_KEYS_NOT_OBJECT,
            restrictMetaSize: true,
        },
        links: {
            type: ['object'],
            patternProperties: AJV_PATTERN_KEYS_NOT_OBJECT,
        },
        recursion: {
            type: 'boolean',
        },
        createdBy: {
            type: 'string',
        },
        data: {
            type: ['object', 'null'],
        },
        unversionedData: {
            type: ['object', 'null'],
            restrictUnversionedDataSize: true,
        },
        permissionsMode: {
            type: 'string',
            enum: ['owner_only', 'parent_and_owner', 'explicit'],
        },
        initialPermissions: {
            type: 'object',
        },
        mirrored: {
            type: 'boolean',
        },
        mode: {
            type: 'string',
            enum: ModeValues,
        },
    },
});

export const validateResolveTenantIdByEntryId = compileSchema({
    type: 'object',
    required: ['entryId'],
    properties: {
        entryId: {
            type: 'string',
        },
    },
});
