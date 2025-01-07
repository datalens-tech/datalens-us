import {extendZodWithOpenApi} from '@asteasolutions/zod-to-openapi';
import {AppError} from '@gravity-ui/nodekit';
import {ZodError, ZodTypeAny, z} from 'zod';

import US_ERRORS from '../../const/us-error-constants';

import * as zc from './custom-types';

extendZodWithOpenApi(z);

export const makeValidator =
    <T extends ZodTypeAny>(schema: T) =>
    (data: unknown): z.infer<T> | never => {
        try {
            return schema.parse(data);
        } catch (err) {
            if (err instanceof ZodError) {
                throw new AppError('Validation error', {
                    code: US_ERRORS.VALIDATION_ERROR,
                    details: err.issues,
                });
            } else {
                throw err;
            }
        }
    };

export {z};
export {zc};
