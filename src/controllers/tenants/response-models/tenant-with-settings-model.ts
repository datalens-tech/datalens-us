import {z} from '../../../components/zod';
import {Tenant} from '../../../db/models/new/tenant';

import {tenantModel} from './tenant-model';

const schema = tenantModel.schema
    .merge(
        z.object({
            settings: z.record(z.string(), z.unknown()),
        }),
    )
    .describe('Tenant with settings model');

export type TenantWithSettingsModel = z.infer<typeof schema>;

const format = (data: Tenant): z.infer<typeof schema> => {
    return {
        ...tenantModel.format(data),
        settings: data.settings,
    };
};

export const tenantWithSettingsModel = {
    schema,
    format,
};
