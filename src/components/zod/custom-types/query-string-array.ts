import {z} from 'zod';

export const queryStringArray = () => {
    return z
        .union([z.string(), z.array(z.string())])
        .transform((val) => (typeof val === 'string' ? [val] : val));
};
