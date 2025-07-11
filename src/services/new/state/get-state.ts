import {AppError} from '@gravity-ui/nodekit';

import {State} from '../../../db/models/new/state';
import {ServiceArgs} from '../types';

interface GetStateArgs {
    entryId: string;
    hash: string;
}

export const getState = async ({ctx, trx}: ServiceArgs, args: GetStateArgs) => {
    const targetTrx = trx ?? State.replica;

    const {entryId, hash} = args;

    const {tenantId} = ctx.get('info');

    ctx.log('GET_STATE_REQUEST', {tenantId, entryId, hash});

    const state = await State.query(targetTrx)
        .findById([hash, entryId])
        .timeout(State.DEFAULT_QUERY_TIMEOUT);

    if (!state) {
        throw new AppError('NOT_EXIST_STATE_BY_HASH', {
            code: 'NOT_EXIST_STATE_BY_HASH',
        });
    }

    ctx.log('GET_STATE_SUCCESS');

    return state;
};
