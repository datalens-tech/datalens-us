import {z} from '../../../components/zod';
import Utils from '../../../utils';

import {FavoriteEntryPresentationWithPermissions, favoriteEntryModel} from './favorite-entry-model';

const schema = z
    .object({
        entries: favoriteEntryModel.schema.array(),
        nextPageToken: z.string().optional(),
    })
    .describe('Favorite entry model array');

const format = async (data: {
    entries: FavoriteEntryPresentationWithPermissions[];
    nextPageToken?: string;
}): Promise<z.infer<typeof schema>> => {
    return {
        entries: await Utils.macrotasksMap(data.entries, favoriteEntryModel.format),
        nextPageToken: data.nextPageToken,
    };
};

export const favoriteEntryModelArray = {
    schema,
    format,
};
