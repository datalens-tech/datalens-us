import {z} from 'zod';

export const stringBigInt = () => {
    return z.string().refine(
        (val) => {
            try {
                BigInt(val);
                return true;
            } catch (e) {
                return false;
            }
        },
        {message: 'String must be a valid integer'},
    );
};
