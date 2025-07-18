import {z} from '../../../components/zod';
import {Tenant} from '../../../db/models/new/tenant';

const schema = z
    .object({
        tenantId: z.string(),
        meta: z.record(z.string(), z.unknown()),
        createdAt: z.string(),
        enabled: z.boolean(),
        deleting: z.boolean(),
        lastInitAt: z.string(),
        retriesCount: z.number(),
        collectionsEnabled: z.boolean(),
        foldersEnabled: z.boolean(),
    })
    .describe('Tenant brief model');

const format = (data: Tenant): z.infer<typeof schema> => {
    return {
        tenantId: data.tenantId,
        meta: data.meta,
        createdAt: data.createdAt,
        enabled: data.enabled,
        deleting: data.deleting,
        lastInitAt: data.lastInitAt,
        retriesCount: data.retriesCount,
        collectionsEnabled: data.collectionsEnabled,
        foldersEnabled: data.foldersEnabled,
    };
};

export const briefTenantModel = {
    schema,
    format,
};
