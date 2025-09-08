import {z} from 'zod';

import {TenantSettings} from '../../../const';

export const tenantSettings = () =>
    z.object({
        key: z.literal(TenantSettings.DefaultColorPaletteId),
        value: z.string(),
    });
