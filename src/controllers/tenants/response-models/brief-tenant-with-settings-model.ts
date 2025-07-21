import {z} from '../../../components/zod';
import {Tenant} from '../../../db/models/new/tenant';

import {briefTenantModel} from './brief-tenant-model';

const schema = briefTenantModel.schema
    .merge(
        z.object({
            settings: z.record(z.string(), z.unknown()),
        }),
    )
    .describe('Tenant brief model with settings');

export type BriefTenantWithSettingsModel = z.infer<typeof schema>;

const format = (data: Tenant): BriefTenantWithSettingsModel => {
    return {
        ...briefTenantModel.format(data),
        settings: data.settings,
    };
};

export const briefTenantWithSettingsModel = {
    schema,
    format,
};
