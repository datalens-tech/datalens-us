import {NotExistEntryError} from '../../../components/errors';
import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {Favorite, FavoriteColumn, FavoriteEntityType} from '../../../db/models/new/favorite';
import {getWorkbook} from '../../../services/new/workbook';
import {DlsActions} from '../../../types/models';
import {
    CollectionEntryPermissions,
    checkCollectionEntryPermission,
} from '../entry/collection-entry';
import {ServiceArgs} from '../types';
import {getPrimary, getReplica} from '../utils';

interface AddFavoriteArgs {
    entryId: string;
}

export const addFavorite = async ({ctx, trx}: ServiceArgs, {entryId}: AddFavoriteArgs) => {
    const {tenantId, user, dlContext} = ctx.get('info');
    const {login, userId} = user;

    ctx.log('ADD_TO_FAVORITES_REQUEST', {
        entryId,
        userId,
        tenantId,
        dlContext,
    });

    const registry = ctx.get('registry');
    const {DLS} = registry.common.classes.get();

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

    if (entry.workbookId) {
        await getWorkbook({ctx}, {workbookId: entry.workbookId});
    } else if (entry.collectionId) {
        await checkCollectionEntryPermission(
            {ctx, trx},
            {entry, permission: CollectionEntryPermissions.Read},
        );
    } else if (ctx.config.dlsEnabled) {
        await DLS.checkPermission(
            {ctx},
            {
                entryId,
                action: DlsActions.Read,
            },
        );
    }

    const result = await Favorite.query(getPrimary(trx))
        .insert({
            [FavoriteColumn.TenantId]: tenantId,
            [FavoriteColumn.EntryId]: entryId,
            [FavoriteColumn.EntityId]: entryId,
            [FavoriteColumn.EntityType]: FavoriteEntityType.Entry,
            [FavoriteColumn.Login]: login,
        })
        .returning('*')
        .timeout(Favorite.DEFAULT_QUERY_TIMEOUT);

    ctx.log('ADD_TO_FAVORITES_SUCCESS');

    return result;
};
