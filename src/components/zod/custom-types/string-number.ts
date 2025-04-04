import {z} from 'zod';

export const stringNumber = ({min = 0, max = Infinity}: {min?: number; max?: number} = {}) =>
    z
        .string()
        .transform((val) => parseInt(val, 10))
        .pipe(z.number().min(min).max(max));
