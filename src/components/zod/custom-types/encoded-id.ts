import {z} from 'zod';

import {transformDecodedId} from './utils';

export const encodedId = () => {
    return z.string().transform((val) => {
        return transformDecodedId(val);
    });
};
