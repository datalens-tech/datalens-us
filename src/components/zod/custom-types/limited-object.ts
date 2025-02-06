import {z} from 'zod';

export const limitedObject = ({limit}: {limit: number}) =>
    z.record(z.string(), z.unknown()).refine(
        (val) => {
            if (JSON.stringify(val).length <= limit) {
                return true;
            }
            return false;
        },
        {
            message: `Object can't contain more than ${limit} characters`,
        },
    );
