import {Model} from '../../../db';
import {Favorite} from '../../../db/models/new/favorite';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';

export interface DeleteFavoriteArgs {
    entryId: string;
}

export const deleteFavoriteService = async (
    {ctx, trx}: ServiceArgs,
    {entryId}: DeleteFavoriteArgs,
) => {
    const {tenantId, user, dlContext} = ctx.get('info');
    ctx.log('DELETE_FROM_FAVORITES_REQUEST', {
        entryId,
        tenantId,
        requestedBy: user,
        dlContext,
    });
    const {login} = user;
    const targetTrx = getPrimary(trx);
    const result = await Favorite.query(targetTrx)
        .delete()
        .where({entryId, tenantId, login})
        .returning('*')
        .timeout(Model.DEFAULT_QUERY_TIMEOUT);

    ctx.log('DELETE_FROM_FAVORITES_SUCCESS');

    return result;
};
