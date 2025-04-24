import {z} from 'zod';

export const stringNumber = (params?: {min?: number; max?: number}) => {
    const min = params?.min ?? -Infinity;
    const max = params?.max ?? Infinity;

    return z
        .string()
        .transform((val) => {
            const parsedVal = parseInt(val, 10);
            return isNaN(parsedVal) ? undefined : parsedVal;
        })
        .pipe(z.number().min(min).max(max));
};
