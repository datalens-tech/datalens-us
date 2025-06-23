import {z} from '../../../components/zod';
import {EntryScope} from '../../../db/models/new/entry/types';
import {JoinedFavoriteEntryColumns} from '../../../db/presentations/joined-favorite-entry';
import {EntryPermissions} from '../../../services/new/entry/types';
import Utils from '../../../utils';
import {entryPermissionsModel} from '../../entries/response-models';

const schema = z
    .object({
        entryId: z.string(),
        scope: z.nativeEnum(EntryScope),
        type: z.string(),
        key: z.string().nullable(),
        alias: z.string().nullable(),
        displayAlias: z.string().nullable(),
        createdBy: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
        hidden: z.boolean(),
        workbookId: z.string().nullable(),
        workbookTitle: z.string().nullable(),
        isLocked: z.boolean().optional(),
        permissions: entryPermissionsModel.schema.optional(),
    })
    .describe('Favorite entry model');

export type FavoriteEntryModel = z.infer<typeof schema>;

export type JoinedFavoriteEntryModelWithPermissions = JoinedFavoriteEntryColumns & {
    isLocked?: boolean;
    permissions?: EntryPermissions;
};

const format = (data: JoinedFavoriteEntryModelWithPermissions): FavoriteEntryModel => {
    return {
        entryId: Utils.encodeId(data.entryId),
        scope: data.scope,
        type: data.type,
        key: data.displayKey,
        alias: data.alias,
        displayAlias: data.displayAlias,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        hidden: data.hidden,
        workbookId: data.workbookId ? Utils.encodeId(data.workbookId) : null,
        workbookTitle: data.title,
        isLocked: data.isLocked,
        permissions: data.permissions ? entryPermissionsModel.format(data.permissions) : undefined,
    };
};

export const favoriteEntryModel = {
    schema,
    format,
};
