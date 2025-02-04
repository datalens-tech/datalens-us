import {z} from 'zod';

export const limitedObject = ({limit}: {limit: number}) =>
    z.record(z.string(), z.unknown()).refine(
        (val) => {
            if (typeof val === 'undefined' || JSON.stringify(val).length <= limit) {
                return true;
            }
            return false;
        },
        {
            message: `Error object can't contain more than ${limit} characters`,
        },
    );
