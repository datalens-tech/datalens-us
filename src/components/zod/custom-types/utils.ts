import {z} from 'zod';

import Utils from '../../../utils';

export const makeIdDecoder = (ctx: z.RefinementCtx) => (val: string) => {
    try {
        return Utils.decodeId(val);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `id '${val}' has incorrect format`,
        });
        return z.NEVER;
    }
};
