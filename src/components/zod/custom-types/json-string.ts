import {z} from 'zod';

export function jsonString<T extends z.ZodType>(schema: T) {
    return z
        .string()
        .transform((str, ctx) => {
            try {
                return JSON.parse(str);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                ctx.addIssue({
                    code: 'custom',
                    message: 'Invalid JSON',
                });
                return z.NEVER;
            }
        })
        .pipe(schema);
}
