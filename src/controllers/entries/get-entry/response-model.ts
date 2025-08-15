import {AppContext} from '@gravity-ui/nodekit';

import {z} from '../../../components/zod';
import {EntryScope} from '../../../db/models/new/entry/types';
import {GetEntryV2Result} from '../../../services/new/entry';
import Utils from '../../../utils';

const schema = z
    .object({
        entryId: z.string(),
        scope: z.nativeEnum(EntryScope),
        type: z.string(),
        key: z.string().nullable(),
        unversionedData: z.record(z.string(), z.unknown()).optional(),
        createdBy: z.string(),
        createdAt: z.string(),
        updatedBy: z.string(),
        updatedAt: z.string(),
        savedId: z.string().nullable(),
        publishedId: z.string().nullable(),
        revId: z.string(),
        tenantId: z.string().nullable(),
        data: z.record(z.string(), z.unknown()).nullable(),
        meta: z.record(z.string(), z.unknown()).nullable(),
        hidden: z.boolean(),
        public: z.boolean(),
        workbookId: z.string().nullable(),
        links: z.record(z.string(), z.unknown()).optional().nullable(),
        isFavorite: z.boolean().optional(),
        permissions: z
            .object({
                execute: z.boolean().optional(),
                read: z.boolean().optional(),
                edit: z.boolean().optional(),
                admin: z.boolean().optional(),
            })
            .optional(),
        servicePlan: z.string().optional(),
        tenantFeatures: z.record(z.string(), z.unknown()).optional(),
        tenantSettings: z.record(z.string(), z.unknown()).optional(),
    })
    .describe('Get entry result');

const format = (
    ctx: AppContext,
    {
        entry,
        revision,
        includePermissionsInfo,
        permissions,
        includeLinks,
        includeServicePlan,
        servicePlan,
        includeTenantFeatures,
        tenantFeatures,
        includeFavorite,
        includeTenantSettings,
        tenantSettings,
    }: GetEntryV2Result,
): z.infer<typeof schema> => {
    const {privatePermissions, onlyPublic} = ctx.get('info');

    let isHiddenUnversionedData = false;
    if (!privatePermissions.ownedScopes.includes(entry.scope)) {
        isHiddenUnversionedData = true;
    }

    let isFavorite: boolean | undefined;

    if (includeFavorite && !onlyPublic) {
        isFavorite = Boolean(entry.favorite);
    }

    const registry = ctx.get('registry');
    const {getEntryAddFormattedFieldsHook} = registry.common.functions.get();
    const additionalFields = getEntryAddFormattedFieldsHook({ctx});

    return {
        entryId: Utils.encodeId(entry.entryId),
        scope: entry.scope,
        type: entry.type,
        key: entry.displayKey,
        unversionedData: isHiddenUnversionedData ? undefined : entry.unversionedData,
        createdBy: entry.createdBy,
        createdAt: entry.createdAt,
        updatedBy: revision.updatedBy,
        updatedAt: revision.updatedAt,
        savedId: entry.savedId ? Utils.encodeId(entry.savedId) : null,
        publishedId: entry.publishedId ? Utils.encodeId(entry.publishedId) : null,
        revId: Utils.encodeId(revision.revId),
        tenantId: entry.tenantId,
        data: revision.data,
        meta: revision.meta,
        hidden: entry.hidden,
        public: entry.public,
        workbookId: entry.workbookId ? Utils.encodeId(entry.workbookId) : null,
        links: includeLinks ? revision.links : undefined,
        isFavorite,
        permissions: includePermissionsInfo ? permissions : undefined,
        servicePlan: includeServicePlan ? servicePlan : undefined,
        tenantFeatures: includeTenantFeatures ? tenantFeatures : undefined,
        tenantSettings: includeTenantSettings ? tenantSettings : undefined,
        ...additionalFields,
    };
};

export const getEntryResult = {
    schema,
    format,
};
