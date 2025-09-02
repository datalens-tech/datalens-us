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
    .describe('Favorite model');

const format = (data: Favorite): z.infer<typeof schema> => {
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
