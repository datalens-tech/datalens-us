import {z} from '../../../components/zod';
import type {Entry as EntryModel} from '../../../db/models/new/entry';
import {EntryScope} from '../../../db/models/new/entry/types';
import type {EntryFullPermissions} from '../../../services/new/entry/types';
import Utils from '../../../utils';
import {entryFullPermissionsModel} from '../../entries/response-models/entry-full-permissions-model';

const schema = z
    .object({
        entryId: z.string(),
        scope: z.enum(EntryScope),
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
        permissions: entryFullPermissionsModel.schema.optional(),
    })
    .describe('Collection entry instance');

const format = ({
    model,
    permissions,
    includePermissionsInfo,
}: {
    model: EntryModel;
    permissions?: EntryFullPermissions;
    includePermissionsInfo?: boolean;
}): z.infer<typeof schema> => {
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
        permissions:
            includePermissionsInfo && permissions
                ? entryFullPermissionsModel.format(permissions, model.scope)
                : undefined,
    };
};

export const collectionEntryInstance = {
    schema,
    format,
};
