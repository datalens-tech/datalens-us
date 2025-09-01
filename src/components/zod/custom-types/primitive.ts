import {z} from 'zod';

export const primitive = () =>
    z
        .union([z.string(), z.number(), z.boolean()])
        .refine((value) => !(typeof value === 'object' || Array.isArray(value)), {
            message: 'Value must be a primitive (string, number or boolean)',
        });
