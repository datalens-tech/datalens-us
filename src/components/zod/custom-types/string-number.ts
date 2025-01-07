import {z} from 'zod';

export const stringNumber = () =>
    z
        .string()
        .transform((val) => parseInt(val, 10))
        .pipe(z.number());
