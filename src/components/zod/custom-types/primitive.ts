import {z} from 'zod';

export const primitive = () => z.union([z.boolean(), z.string(), z.number(), z.null()]);
