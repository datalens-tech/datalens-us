import {z} from '../../../components/zod';
import {EntryScope} from '../../../db/models/new/entry/types';
import {EntryPermissions} from '../../../services/new/entry/types';
import * as MT from '../../../types/models';
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

interface FavoriteFields extends MT.FavoriteColumns {
    scope: EntryScope;
    type: string;
    key: string;
    alias: string | null;
    displayAlias: string | null;
    sortAlias: string | null;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    hidden: boolean;
    workbookId: string | null;
    workbookTitle: string | null;
    isLocked: boolean;
    permissions?: EntryPermissions;
}
export interface Favorite extends FavoriteFields {}

const format = (data: Favorite): FavoriteEntryModel => {
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
