import {Model} from '../../../db';
import {Favorite} from '../../../db/models/new/favorite';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

interface RenameFavoriteArgs {
    entryId: string;
    name: string | null;
}

export const renameFavoriteService = async (
    {ctx, trx}: ServiceArgs,
    {entryId, name}: RenameFavoriteArgs,
) => {
    const {tenantId, user, dlContext} = ctx.get('info');

    ctx.log('RENAME_FAVORITE_REQUEST', {
        tenantId,
        entryId,
        name,
        user,
        dlContext,
    });
    const {login} = user;
    const targetTrx = getReplica(trx);
    const displayAlias = name ? name : null;
    const alias = displayAlias ? displayAlias.toLowerCase() : null;

    const result = (await Favorite.query(targetTrx)
        .update({alias, displayAlias})
        .where({entryId, tenantId, login})
        .returning('*')
        .first()
        .timeout(Model.DEFAULT_QUERY_TIMEOUT)) as unknown as Favorite;

    ctx.log('RENAME_FAVORITE_SUCCESS');

    return result;
};
