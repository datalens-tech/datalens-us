import {AppError} from '@gravity-ui/nodekit';

import {US_ERRORS} from '../../../const';
import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {Favorite, FavoriteColumn} from '../../../db/models/new/favorite';
import {ServiceArgs} from '../types';
import {getPrimary, getReplica} from '../utils';

export interface DeleteFavoriteArgs {
    entryId: string;
}

export const deleteFavorite = async ({ctx, trx}: ServiceArgs, {entryId}: DeleteFavoriteArgs) => {
    const {tenantId, user, dlContext} = ctx.get('info');
    const {login, userId} = user;

    ctx.log('DELETE_FROM_FAVORITES_REQUEST', {
        entryId,
        userId,
        tenantId,
        dlContext,
    });

    const entry = await Entry.query(getReplica(trx))
        .select()
        .where({
            [EntryColumn.EntryId]: entryId,
            [EntryColumn.TenantId]: tenantId,
            [EntryColumn.IsDeleted]: false,
        })
        .first()
        .timeout(Entry.DEFAULT_QUERY_TIMEOUT);

    if (!entry) {
        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
    }

    const result = await Favorite.query(getPrimary(trx))
        .delete()
        .where({
            [FavoriteColumn.EntryId]: entryId,
            [FavoriteColumn.TenantId]: tenantId,
            [FavoriteColumn.Login]: login,
        })
        .returning('*')
        .timeout(Favorite.DEFAULT_QUERY_TIMEOUT);

    ctx.log('DELETE_FROM_FAVORITES_SUCCESS');

    return result;
};
