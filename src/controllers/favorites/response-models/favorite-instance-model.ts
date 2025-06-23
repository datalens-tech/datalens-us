import {z} from '../../../components/zod';
import {Favorite} from '../../../db/models/new/favorite';

const schema = z
    .object({
        entryId: z.string(),
        login: z.string(),
        tenantId: z.string(),
        createdAt: z.string(),
        alias: z.string().nullable(),
        displayAlias: z.string().nullable().optional(),
        sortAlias: z.string().nullable().optional(),
    })
    .describe('Favorite instance model');

export type FavoriteInstanceModel = z.infer<typeof schema>;

const format = (data: Favorite): FavoriteInstanceModel => {
    return {
        entryId: data.entryId,
        login: data.login,
        tenantId: data.tenantId,
        createdAt: data.createdAt,
        alias: data.alias || null,
        displayAlias: data.displayAlias || null,
        sortAlias: data.sortAlias || null,
    };
};

export const favoriteInstanceModel = {
    schema,
    format,
};
