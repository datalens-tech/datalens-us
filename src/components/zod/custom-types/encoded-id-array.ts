import {z} from 'zod';

import Utils from '../../../utils';

import {transformDecodedId} from './utils';

export const encodedIdArray = ({min = 0, max = Infinity}: {min?: number; max?: number}) => {
    return z
        .string()
        .array()
        .min(min)
        .max(max)
        .transform(async (val, ctx) => {
            return Utils.macrotasksMap(val, transformDecodedId(ctx));
        });
};
