import {z} from 'zod';

export const stringBigInt = () => {
    return z.string().refine(
        (val) => {
            try {
                BigInt(val);
                return true;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                return false;
            }
        },
        {
            error: 'String must be a valid integer',
        },
    );
};
