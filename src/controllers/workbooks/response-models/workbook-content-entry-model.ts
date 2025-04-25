import {z} from '../../../components/zod';
import {EntryScope} from '../../../db/models/new/entry/types';
import {JoinedEntryRevisionFavoriteColumns} from '../../../db/presentations/joined-entry-revision-favorite';
import {EntryPermissions} from '../../../services/new/entry/types';
import Utils from '../../../utils';
import {entryPermissionsModel} from '../../entries/response-models';

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
        savedId: z.string().nullable(),
        publishedId: z.string().nullable(),
        revId: z.string(),
        meta: z.record(z.string(), z.unknown()).nullable(),
        hidden: z.boolean().nullable(),
        workbookId: z.string().nullable(),
        tenantId: z.string().nullable(),
        isFavorite: z.boolean(),
        isLocked: z.boolean(),
        permissions: entryPermissionsModel.schema.optional(),
        mirrored: z.boolean().nullable(),
    })
    .describe('Workbook content entry model');

type WorkbookContentEntryModel = z.infer<typeof schema>;

const format = (
    data: JoinedEntryRevisionFavoriteColumns & {
        isLocked: boolean;
        permissions?: EntryPermissions;
    },
): WorkbookContentEntryModel => {
    return {
        entryId: Utils.encodeId(data.entryId),
        scope: data.scope,
        type: data.type,
        key: data.displayKey, // TODO: use displayKey instead of key in UI
        displayKey: data.displayKey,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        updatedBy: data.updatedBy,
        updatedAt: data.updatedAt,
        savedId: data.savedId ? Utils.encodeId(data.savedId) : null,
        publishedId: data.publishedId ? Utils.encodeId(data.publishedId) : null,
        revId: Utils.encodeId(data.revId),
        meta: data.meta,
        hidden: data.hidden,
        workbookId: data.workbookId ? Utils.encodeId(data.workbookId) : null,
        tenantId: data.tenantId,
        isFavorite: data.isFavorite,
        isLocked: data.isLocked,
        permissions: data.permissions ? entryPermissionsModel.format(data.permissions) : undefined,
        mirrored: data.mirrored,
    };
};

export const workbookContentEntryModel = {
    schema,
    format,
};
