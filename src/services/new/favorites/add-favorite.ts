import {AppError} from '@gravity-ui/nodekit';

import {Model} from '../../../db';
import {Entry} from '../../../db/models/new/entry';
import {Favorite} from '../../../db/models/new/favorite';
import {getWorkbook} from '../../../services/new/workbook';
import {DlsActions} from '../../../types/models';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

interface AddFavoriteArgs {
    entryId: string;
}

export const addFavoriteService = async ({ctx, trx}: ServiceArgs, {entryId}: AddFavoriteArgs) => {
    const {tenantId, user, dlContext} = ctx.get('info');
    ctx.log('ADD_TO_FAVORITES_REQUEST', {
        tenantId,
        entryId,
        user,
        dlContext,
    });

    const registry = ctx.get('registry');
    const {DLS} = registry.common.classes.get();
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

    const result = await Favorite.query(targetTrx)
        .insert({tenantId, entryId, login})
        .returning('*')
        .timeout(Model.DEFAULT_QUERY_TIMEOUT);

    ctx.log('ADD_TO_FAVORITES_SUCCESS');

    return result;
};
