import {z} from 'zod';

import {isTrueArg} from '../../../utils/env-utils';

export const stringBoolean = () => z.string().toLowerCase().transform(isTrueArg).pipe(z.boolean());
