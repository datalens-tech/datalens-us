import {z} from 'zod';

export const queryArray = ({min = 0, max = Infinity}: {min?: number; max?: number} = {}) =>
    z
        .union([z.string(), z.array(z.string()), z.record(z.string().regex(/^\d+$/), z.string())])
        .transform((value) => {
            if (typeof value === 'string') {
                return [value];
            }

            if (Array.isArray(value)) {
                return value;
            }

            return Object.values(value);
        })
        .pipe(z.array(z.string()).min(min).max(max));
