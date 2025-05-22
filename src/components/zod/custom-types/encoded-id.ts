import {z} from 'zod';

import {ENCODED_ID_LENGTH} from '../../../const';

import {makeIdDecoder} from './utils';

export const encodedId = () => {
    return z
        .string()
        .length(ENCODED_ID_LENGTH)
        .transform((val, ctx) => {
            return makeIdDecoder(ctx)(val);
        });
};
