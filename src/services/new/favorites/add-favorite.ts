import {AppError} from '@gravity-ui/nodekit';

import {US_ERRORS} from '../../../const';
import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {Favorite, FavoriteColumn} from '../../../db/models/new/favorite';
import {getWorkbook} from '../../../services/new/workbook';
import {DlsActions} from '../../../types/models';
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
        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
    }

    if (entry.workbookId) {
        await getWorkbook({ctx}, {workbookId: entry.workbookId});
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
            [FavoriteColumn.Login]: login,
        })
        .returning('*')
        .timeout(Favorite.DEFAULT_QUERY_TIMEOUT);

    ctx.log('ADD_TO_FAVORITES_SUCCESS');

    return result;
};
