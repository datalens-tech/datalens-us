import {z} from 'zod';

export const stringArray = ({min = 0, max = Infinity}: {min?: number; max?: number}) => {
    return z
        .union([z.string(), z.array(z.string())])
        .transform((val) => (typeof val === 'string' ? [val] : val))
        .pipe(z.array(z.string()).min(min).max(max));
};
