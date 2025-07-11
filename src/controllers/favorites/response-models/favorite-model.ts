import {z} from '../../../components/zod';
import {Favorite} from '../../../db/models/new/favorite';
import Utils from '../../../utils';

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

export type FavoriteModel = z.infer<typeof schema>;

const format = (data: Favorite): FavoriteModel => {
    return {
        entryId: Utils.encodeId(data.entryId),
        login: data.login,
        tenantId: data.tenantId,
        createdAt: data.createdAt,
        alias: data.alias,
        displayAlias: data.displayAlias,
        sortAlias: data.sortAlias,
    };
};

export const favoriteModel = {
    schema,
    format,
};
