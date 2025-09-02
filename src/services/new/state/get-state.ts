import {AppError} from '@gravity-ui/nodekit';

import {US_ERRORS} from '../../../const';
import {State} from '../../../db/models/new/state';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

interface GetStateArgs {
    entryId: string;
    hash: string;
}

export const getState = async ({ctx, trx}: ServiceArgs, args: GetStateArgs) => {
    const targetTrx = getReplica(trx);

    const {entryId, hash} = args;

    const {tenantId} = ctx.get('info');

    ctx.log('GET_STATE_REQUEST', {tenantId, entryId, hash});

    const state = await State.query(targetTrx)
        .findById([hash, entryId])
        .timeout(State.DEFAULT_QUERY_TIMEOUT);

    if (!state) {
        throw new AppError(US_ERRORS.NOT_EXIST_STATE_BY_HASH, {
            code: US_ERRORS.NOT_EXIST_STATE_BY_HASH,
        });
    }

    ctx.log('GET_STATE_SUCCESS');

    return state;
};
