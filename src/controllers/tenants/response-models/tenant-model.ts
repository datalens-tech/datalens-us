import {z} from '../../../components/zod';
import {Tenant} from '../../../db/models/new/tenant';

const schema = z
    .object({
        tenantId: z.string(),
        meta: z.record(z.string(), z.unknown()),
        createdAt: z.string(),
        enabled: z.boolean(),
        deleting: z.boolean(),
        collectionsEnabled: z.boolean(),
        foldersEnabled: z.boolean(),
        settings: z.record(z.string(), z.unknown()),
        features: z.record(z.string(), z.unknown()),
        branding: z.record(z.string(), z.unknown()),
    })
    .describe('Tenant detailed model');

const format = (data: Tenant): z.infer<typeof schema> => {
    return {
        tenantId: data.tenantId,
        meta: data.meta,
        createdAt: data.createdAt,
        enabled: data.enabled,
        deleting: data.deleting,
        collectionsEnabled: data.collectionsEnabled,
        foldersEnabled: data.foldersEnabled,
        settings: data.settings,
        features: data.features,
        branding: data.branding,
    };
};

export const tenantModel = {
    schema,
    format,
};
