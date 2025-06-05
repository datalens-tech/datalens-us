import {z} from 'zod';

export function jsonString<T extends z.ZodTypeAny>(schema: T) {
    return z
        .string()
        .transform((str, ctx) => {
            try {
                return JSON.parse(str);
            } catch (error) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Invalid JSON',
                });
                return z.INVALID;
            }
        })
        .pipe(schema);
}
