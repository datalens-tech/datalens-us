import {z} from 'zod';

const MAX_BRANDING_OBJECT_SYMBOLS = 15000;

export const brandingObject = () =>
    z
        .record(z.string(), z.any())
        .or(z.null())
        .refine(
            (val) => {
                if (val === null) {
                    return true;
                } else {
                    const dataStringified = JSON.stringify(val);
                    return dataStringified.length <= MAX_BRANDING_OBJECT_SYMBOLS;
                }
            },
            {
                message: `Branding object can contain not greater ${MAX_BRANDING_OBJECT_SYMBOLS} symbols`,
            },
        );
