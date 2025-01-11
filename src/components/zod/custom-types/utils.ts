import {z} from 'zod';

import Utils from '../../../utils';

export const transformDecodedId = (ctx: z.RefinementCtx) => (val: string) => {
    try {
        return Utils.decodeId(val);
    } catch (err) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `id '${val}' has incorrect format`,
        });
        return z.NEVER;
    }
};
