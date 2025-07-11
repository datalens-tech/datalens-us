import {AppError} from '@gravity-ui/nodekit';

import {Model} from '../../../db';
import {Entry} from '../../../db/models/new/entry';
import {Favorite} from '../../../db/models/new/favorite';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

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
    const targetTrx = getReplica(trx);

    const entry = await Entry.query(targetTrx)
        .select()
        .where({
            entryId,
            tenantId,
            isDeleted: false,
        })
        .first()
        .timeout(Model.DEFAULT_QUERY_TIMEOUT);

    if (!entry) {
        throw new AppError('NOT_EXIST_ENTRY', {
            code: 'NOT_EXIST_ENTRY',
        });
    }

    const result = await Favorite.query(targetTrx)
        .delete()
        .where({entryId, tenantId, login})
        .returning('*')
        .timeout(Model.DEFAULT_QUERY_TIMEOUT);

    ctx.log('DELETE_FROM_FAVORITES_SUCCESS');

    return result;
};
