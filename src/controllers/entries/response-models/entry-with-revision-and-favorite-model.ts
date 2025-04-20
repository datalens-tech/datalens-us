import {z} from '../../../components/zod';
import {JoinedEntryRevisionFavoriteColumns} from '../../../db/presentations/joined-entry-revision-favorite';

import {entryWithRevisionModel} from './entry-with-revision-model';

const schema = entryWithRevisionModel.schema
    .merge(
        z.object({
            isFavorite: z.boolean(),
        }),
    )
    .describe('Entry with revision and favorite model');

export type EntryWithRevisionAndFavoriteModel = z.infer<typeof schema>;

const format = (data: JoinedEntryRevisionFavoriteColumns): EntryWithRevisionAndFavoriteModel => {
    return {
        ...entryWithRevisionModel.format(data),
        isFavorite: data.isFavorite,
    };
};

export const entryWithRevisionAndFavoriteModel = {
    schema,
    format,
};
