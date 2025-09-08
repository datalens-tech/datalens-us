import {z} from 'zod';

export const primitive = () => z.union([z.string(), z.number(), z.boolean()]);
