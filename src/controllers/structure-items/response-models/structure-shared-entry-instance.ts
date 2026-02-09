import {z} from '../../../components/zod';
import {EntryScope} from '../../../db/models/new/entry/types';
import type {SharedEntryInstance} from '../../../registry/plugins/common/entities/shared-entry/types';
import Utils from '../../../utils';
import {sharedEntryPermissionsModel} from '../../entries/response-models';

const schema = z
    .object({
        entryId: z.string(),
        scope: z.nativeEnum(EntryScope),
        type: z.string(),
        key: z.string().nullable(),
        displayKey: z.string().nullable(),
        createdBy: z.string(),
        createdAt: z.string(),
        updatedBy: z.string(),
        updatedAt: z.string(),
        tenantId: z.string().nullable(),
        workbookId: z.string().nullable(),
        collectionId: z.string().nullable(),
        permissions: sharedEntryPermissionsModel.schema.optional(),
    })
    .describe('Shared entry instance');

const format = ({
    sharedEntry,
    includePermissionsInfo,
}: {
    sharedEntry: SharedEntryInstance;
    includePermissionsInfo?: boolean;
}): z.infer<typeof schema> => {
    const {model} = sharedEntry;

    return {
        entryId: Utils.encodeId(model.entryId),
        scope: model.scope,
        type: model.type,
        key: model.key,
        displayKey: model.displayKey,
        createdBy: model.createdBy,
        createdAt: model.createdAt,
        updatedBy: model.updatedBy,
        updatedAt: model.updatedAt,
        tenantId: model.tenantId,
        workbookId: model.workbookId ? Utils.encodeId(model.workbookId) : null,
        collectionId: model.collectionId ? Utils.encodeId(model.collectionId) : null,
        permissions: includePermissionsInfo ? sharedEntry.permissions : undefined,
    };
};

export const sharedEntryInstance = {
    schema,
    format,
};
