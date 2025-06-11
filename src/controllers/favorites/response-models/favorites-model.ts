import {z} from '../../../components/zod';
import {EntryPermissions} from '../../../services/new/entry/types';
import Utils from '../../../utils';

import {Favorite, favoriteEntryModel} from './favorite-entry-model';

const schema = z
    .object({
        entries: favoriteEntryModel.schema.array(),
        nextPageToken: z.string().optional(),
    })
    .describe('Favorites model');

export type FavoritesModel = z.infer<typeof schema>;

const format = async (data: {
    entries: (Favorite & {
        isLocked: boolean;
        permissions?: EntryPermissions;
    })[];
    nextPageToken?: string;
}): Promise<FavoritesModel> => {
    return {
        entries: await Utils.macrotasksMap(data.entries, favoriteEntryModel.format),
        nextPageToken: data.nextPageToken,
    };
};
export const favoritesModel = {
    schema,
    format,
};
