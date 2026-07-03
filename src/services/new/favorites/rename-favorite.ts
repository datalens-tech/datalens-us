import {AppError} from '@gravity-ui/nodekit';

import {NotExistEntryError} from '../../../components/errors';
import {US_ERRORS} from '../../../const';
import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {Favorite, FavoriteColumn, FavoriteEntityType} from '../../../db/models/new/favorite';
import {ServiceArgs} from '../types';
import {getPrimary, getReplica} from '../utils';

interface RenameFavoriteArgs {
    entryId: string;
    name: string | null;
}

export const renameFavorite = async (
    {ctx, trx}: ServiceArgs,
    {entryId, name}: RenameFavoriteArgs,
) => {
    const {tenantId, user, dlContext} = ctx.get('info');
    const {login, userId} = user;

    ctx.log('RENAME_FAVORITE_REQUEST', {
        entryId,
        userId,
        tenantId,
        name,
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

    const displayAlias = name ? name : null;
    const alias = displayAlias ? displayAlias.toLowerCase() : null;

    const result = await Favorite.query(getPrimary(trx))
        .patch({[FavoriteColumn.Alias]: alias, [FavoriteColumn.DisplayAlias]: displayAlias})
        .where({
            [FavoriteColumn.EntityId]: entryId,
            [FavoriteColumn.EntityType]: FavoriteEntityType.Entry,
            [FavoriteColumn.TenantId]: tenantId,
            [FavoriteColumn.Login]: login,
        })
        .returning('*')
        .first()
        .timeout(Favorite.DEFAULT_QUERY_TIMEOUT);

    if (!result) {
        throw new AppError(US_ERRORS.FAVORITE_NOT_EXISTS, {
            code: US_ERRORS.FAVORITE_NOT_EXISTS,
        });
    }

    ctx.log('RENAME_FAVORITE_SUCCESS');

    return result;
};
