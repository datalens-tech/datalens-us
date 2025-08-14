import {z} from 'zod';

import {KEY_REG, symbolsValidateMessage} from '../../validation-schema-compiler';

export const entryName = () =>
    z
        .string()
        .refine((value) => !value.includes('/'), {
            message: 'String should not contain the symbol /',
        })
        .refine((value) => KEY_REG.test(value), {
            message: `String ${symbolsValidateMessage}`,
        });
