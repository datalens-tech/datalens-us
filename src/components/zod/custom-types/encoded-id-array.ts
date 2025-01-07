import {z} from 'zod';

import {encodedId} from './encoded-id';

export const encodedIdArray = ({min = 0, max = Infinity}: {min?: number; max?: number}) => {
    const res = z.string().array().min(min).max(max).pipe(encodedId().array());
    return res;
};
