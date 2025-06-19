import {z} from '../../../components/zod';
import Favorite from '../../../db/models/favorite';
import {EntryScope} from '../../../db/models/new/entry/types';
import {EntryPermissions} from '../../../services/new/entry/types';
import Utils from '../../../utils';
import {entryPermissionsModel} from '../../entries/response-models';

const schema = z
    .object({
        entryId: z.string(),
        scope: z.nativeEnum(EntryScope),
        type: z.string(),
        key: z.string(),
        alias: z.string().nullable(),
        displayAlias: z.string().nullable(),
        sortAlias: z.string().nullable(),
        createdBy: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
        hidden: z.boolean(),
        workbookId: z.string().nullable(),
        workbookTitle: z.string().nullable(),
        login: z.string().nullable(),
        tenantId: z.string(),
        isLocked: z.boolean().nullable(),
        permissions: entryPermissionsModel.schema.optional(),
    })
    .describe('Favorite entry model');

export type FavoriteEntryModel = z.infer<typeof schema>;

export interface FavoriteEntry extends Favorite {
    scope: EntryScope;
    type: string;
    key: string;
    sortAlias: string | null;
    createdBy: string;
    updatedAt: string;
    hidden: boolean;
    workbookTitle: string | null;
}
export interface FavoriteEntryWithPermissions extends FavoriteEntry {
    isLocked: boolean;
    permissions?: EntryPermissions;
}

const format = (data: FavoriteEntryWithPermissions): FavoriteEntryModel => {
    return {
        entryId: Utils.encodeId(data.entryId),
        scope: data.scope,
        type: data.type,
        key: data.key,
        alias: data.alias,
        displayAlias: data.displayAlias,
        sortAlias: data.sortAlias,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        hidden: data.hidden,
        workbookId: data.workbookId ? Utils.encodeId(data.workbookId) : null,
        workbookTitle: data.workbookTitle,
        login: data.login,
        tenantId: data.tenantId,
        isLocked: data.isLocked,
        permissions: data.permissions ? entryPermissionsModel.format(data.permissions) : undefined,
    };
};

export const favoriteEntryModel = {
    schema,
    format,
};
