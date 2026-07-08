import {AppContext} from '@gravity-ui/nodekit';

import {filterUnversionedData} from '../../../components/private-permissions';
import {z} from '../../../components/zod';
import {EntryScope} from '../../../db/models/new/entry/types';
import {RevisionAnnotationFields} from '../../../db/models/new/revision';
import {GetEntryResult} from '../../../services/new/entry';
import Utils from '../../../utils';
import {entryFullPermissionsModel} from '../response-models/entry-full-permissions-model';
import {entryPermissionsModel} from '../response-models/entry-permissions-model';

const schema = z
    .object({
        entryId: z.string(),
        scope: z.enum(EntryScope),
        type: z.string(),
        key: z.string().nullable(),
        unversionedData: z.record(z.string(), z.unknown()).nullish(),
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
        annotation: z
            .object({
                [RevisionAnnotationFields.Description]: z.string().optional(),
            })
            .nullable(),
        hidden: z.boolean(),
        public: z.boolean(),
        workbookId: z.string().nullable(),
        collectionId: z.string().nullable(),
        links: z.record(z.string(), z.unknown()).nullable().optional(),
        isFavorite: z.boolean().optional(),
        permissions: entryPermissionsModel.schema.optional(),
        fullPermissions: entryFullPermissionsModel.schema.optional(),
        servicePlan: z.string().optional(),
        tenantFeatures: z.record(z.string(), z.unknown()).optional(),
        tenantSettings: z.record(z.string(), z.unknown()).optional(),
        version: z.number().nullable(),
        sourceVersion: z.number().nullable(),
    })
    .describe('Get entry result');

const format = (
    ctx: AppContext,
    {
        entry,
        revision,
        includePermissionsInfo,
        permissions,
        fullPermissions,
        includeLinks,
        includeServicePlan,
        servicePlan,
        includeTenantFeatures,
        tenantFeatures,
        includeFavorite,
        includeTenantSettings,
        tenantSettings,
    }: GetEntryResult,
): z.infer<typeof schema> => {
    const {privatePermissions, onlyPublic} = ctx.get('info');

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
        unversionedData: filterUnversionedData(
            entry.scope,
            entry.unversionedData,
            privatePermissions,
        ),
        createdBy: entry.createdBy,
        createdAt: entry.createdAt,
        updatedBy: revision.updatedBy,
        updatedAt: revision.updatedAt,
        savedId: Utils.encodeIdOrNull(entry.savedId),
        publishedId: Utils.encodeIdOrNull(entry.publishedId),
        revId: Utils.encodeId(revision.revId),
        tenantId: entry.tenantId,
        data: revision.data,
        meta: revision.meta,
        annotation: revision.annotation,
        version: revision.version,
        sourceVersion: revision.sourceVersion,
        hidden: entry.hidden,
        public: entry.public,
        workbookId: Utils.encodeIdOrNull(entry.workbookId),
        collectionId: Utils.encodeIdOrNull(entry.collectionId),
        links: includeLinks ? revision.links : undefined,
        isFavorite,
        permissions: includePermissionsInfo ? permissions : undefined,
        fullPermissions:
            includePermissionsInfo && fullPermissions
                ? entryFullPermissionsModel.format(fullPermissions, entry.scope)
                : undefined,
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
