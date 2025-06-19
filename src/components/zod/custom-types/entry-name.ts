import {z} from 'zod';

// unicode spaces https://jkorpela.fi/chars/spaces.html
export const KEY_REG =
    /^[\wА-Яа-яЁё_@()%]([\wА-Яа-яЁё_@().,:;'\u00A0\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF| \-–—−$*&%]*[\wА-Яа-яЁё_@()%]+)?$/;

const symbolsValidateMessage =
    "should start and end with A-Za-zА-Яа-яЁё0-9_@()% and can contain only symbols: A-Za-zА-Яа-яЁё0-9_@()%.,:;'|-–—−$*& and spaces";

export const entryName = () =>
    z
        .string()
        .refine(
            (name) => {
                const isAllowedBySlash = /^[^/]*$/.test(name);
                return isAllowedBySlash;
            },
            {
                message: 'should not contain the symbol /',
            },
        )
        .refine((name) => KEY_REG.test(name), {
            message: symbolsValidateMessage,
        });
