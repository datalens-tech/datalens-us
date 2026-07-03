import {NotExistEntryError} from '../../../components/errors';
import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {Favorite, FavoriteColumn, FavoriteEntityType} from '../../../db/models/new/favorite';
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
        throw new NotExistEntryError();
    }

    const result = await Favorite.query(getPrimary(trx))
        .delete()
        .where({
            [FavoriteColumn.EntityId]: entryId,
            [FavoriteColumn.EntityType]: FavoriteEntityType.Entry,
            [FavoriteColumn.TenantId]: tenantId,
            [FavoriteColumn.Login]: login,
        })
        .returning('*')
        .timeout(Favorite.DEFAULT_QUERY_TIMEOUT);

    ctx.log('DELETE_FROM_FAVORITES_SUCCESS');

    return result;
};
