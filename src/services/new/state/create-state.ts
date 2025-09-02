import hashGenerator from '../../../components/hash-generator';
import {State, StateColumn} from '../../../db/models/new/state';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';

interface CreateStateArgs {
    entryId: string;
    data: Record<string, unknown>;
}

export const createState = async ({ctx, trx}: ServiceArgs, args: CreateStateArgs) => {
    const targetTrx = getPrimary(trx);

    const {entryId, data} = args;

    const {tenantId} = ctx.get('info');

    ctx.log('CREATE_STATE_REQUEST', {tenantId, entryId});

    const hash = hashGenerator({entryId, data});

    const existingStateByHash = await State.query(targetTrx)
        .findById([hash, entryId])
        .timeout(State.DEFAULT_QUERY_TIMEOUT);

    if (existingStateByHash) {
        ctx.log('RETURN_HASH_FROM_BD');
        return existingStateByHash;
    }

    const state = await State.query(targetTrx)
        .insert({
            [StateColumn.Hash]: hash,
            [StateColumn.EntryId]: entryId,
            [StateColumn.Data]: data,
        })
        .returning('*')
        .timeout(State.DEFAULT_QUERY_TIMEOUT);

    ctx.log('CREATE_STATE_SUCCESS');

    return state;
};
