import {z} from 'zod';

export const stringSqlTimestampz = () => {
    return z
        .string()
        .regex(
            /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:.\d{1,6})?[+-]\d{2}(?::?\d{2})?$/,
            'Invalid timestamptz',
        );
};
