import {z} from 'zod';

import {makeIdDecoder} from './utils';

export const encodedId = () => {
    return z
        .string()
        .length(13)
        .transform((val, ctx) => {
            return makeIdDecoder(ctx)(val);
        });
};
