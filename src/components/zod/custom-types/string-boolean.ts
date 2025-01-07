import {z} from 'zod';

import Utils from '../../../utils';

export const stringBoolean = () =>
    z.string().toLowerCase().transform(Utils.isTrueArg).pipe(z.boolean());
