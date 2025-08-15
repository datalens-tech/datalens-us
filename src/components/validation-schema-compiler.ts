'use strict';

import {AppError} from '@gravity-ui/nodekit';
import Ajv from 'ajv';

import {
    MAX_BRANDING_OBJECT_SYMBOLS,
    MAX_META_OBJECT_SYMBOLS,
    MAX_UNVERSIONED_DATA_OBJECT_SYMBOLS,
} from '../const';
import {US_ERRORS} from '../const/errors';

const ajv = new Ajv({
    allErrors: true,
    verbose: true,
});

// unicode spaces https://jkorpela.fi/chars/spaces.html
export const KEY_REG =
    /^[\wА-Яа-яЁё_@()%]([\wА-Яа-яЁё_@().,:;'\u00A0\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF| \-–—−$*&%]*[\wА-Яа-яЁё_@()%]+)?$/;

export const symbolsValidateMessage =
    "should start and end with A-Za-zА-Яа-яЁё0-9_@()% and can contain only symbols: A-Za-zА-Яа-яЁё0-9_@()%.,:;'|-–—−$*& and spaces";

ajv.addKeyword('verifyEntryKey', {
    validate: function validate(schema: object | string | boolean, data: any) {
        if (data.startsWith('/')) {
            // @ts-ignore
            validate.errors = [
                {
                    format: 'string',
                    message: 'should not start with /',
                    params: {
                        keyword: 'verifyEntryKey',
                    },
                },
            ];
            return false;
        }

        const isAllowed = data.split('/').every((part: string): boolean => KEY_REG.test(part));

        // @ts-ignore
        validate.errors = [
            {
                format: 'string',
                message: symbolsValidateMessage,
                params: {
                    keyword: 'verifyEntryKey',
                },
            },
        ];

        return isAllowed;
    },
    errors: true,
});

ajv.addKeyword('verifyEntryName', {
    validate: function validate(schema: object | string | boolean, data: any) {
        const isAllowedBySlash = /^[^/]*$/.test(data);

        if (!isAllowedBySlash) {
            // @ts-ignore
            validate.errors = [
                {
                    format: 'string',
                    message: 'should not contain the symbol /',
                    params: {
                        keyword: 'verifyEntryName',
                    },
                },
            ];
            return false;
        }

        const isAllowed = KEY_REG.test(data);

        // @ts-ignore
        validate.errors = [
            {
                format: 'string',
                message: symbolsValidateMessage,
                params: {
                    keyword: 'verifyEntryName',
                },
            },
        ];

        return isAllowed;
    },
    errors: true,
});

ajv.addKeyword('restrictMetaSize', {
    validate: function validate(schema: object | string | boolean, data: any) {
        if (data === null) {
            return true;
        } else {
            const dataStringified = JSON.stringify(data);

            // @ts-ignore
            validate.errors = [
                {
                    format: 'string',
                    message: `meta jsonb object can contain not greater ${MAX_META_OBJECT_SYMBOLS} symbols`,
                    params: {
                        keyword: 'restrictMetaSize',
                    },
                },
            ];

            return dataStringified.length <= MAX_META_OBJECT_SYMBOLS;
        }
    },
    errors: true,
});

ajv.addKeyword('restrictBrandingSize', {
    validate: function validate(schema: object | string | boolean, data: any) {
        if (data === null) {
            return true;
        } else {
            const dataStringified = JSON.stringify(data);

            // @ts-ignore
            validate.errors = [
                {
                    format: 'string',
                    message: `branding jsonb object can contain not greater ${MAX_BRANDING_OBJECT_SYMBOLS} symbols`,
                    params: {
                        keyword: 'restrictBrandingSize',
                    },
                },
            ];

            return dataStringified.length <= MAX_BRANDING_OBJECT_SYMBOLS;
        }
    },
    errors: true,
});

ajv.addKeyword('restrictUnversionedDataSize', {
    validate: function validate(schema: object | string | boolean, data: any) {
        if (data === null) {
            return true;
        } else {
            const dataStringified = JSON.stringify(data);

            // @ts-ignore
            validate.errors = [
                {
                    format: 'string',
                    message: `unversionedData jsonb object can contain not greater ${MAX_UNVERSIONED_DATA_OBJECT_SYMBOLS} symbols`,
                    params: {
                        keyword: 'restrictUnversionedDataSize',
                    },
                },
            ];

            return dataStringified.length <= MAX_UNVERSIONED_DATA_OBJECT_SYMBOLS;
        }
    },
    errors: true,
});

const compileSchema = (schema: object) => {
    const validate = ajv.compile(schema);

    return (data: object) => {
        const isValid = validate(data);

        return {
            isValid,
            validationErrors: ajv.errorsText(validate.errors),
        };
    };
};

export default compileSchema;

export const makeSchemaValidator = (schema: object) => {
    const preparedSchema = compileSchema(schema);
    return <T extends object>(data: T): T => {
        const {isValid, validationErrors} = preparedSchema(data);
        if (!isValid) {
            throw new AppError('Validation error', {
                code: US_ERRORS.VALIDATION_ERROR,
                details: {validationErrors},
            });
        }
        return data;
    };
};
