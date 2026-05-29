import {AppError} from '@gravity-ui/nodekit';

import {US_ERRORS} from '../../../const';
import {queryReplica} from '../../../db';
import {State} from '../../../db/models/new/state';
import {ServiceArgs} from '../types';

interface GetStateArgs {
    entryId: string;
    hash: string;
}

export const getState = async ({ctx, mainTrx}: ServiceArgs<'mainTrx'>, args: GetStateArgs) => {
    const {entryId, hash} = args;

    const {tenantId} = ctx.get('info');

    ctx.log('GET_STATE_REQUEST', {tenantId, entryId, hash});

    const state = await queryReplica(State, mainTrx)
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
