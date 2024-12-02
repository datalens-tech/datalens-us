import {AppError} from '@gravity-ui/nodekit';

import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {State} from '../../../db/models/new/state';
import {ServiceArgs} from '../types';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['entryId', 'hash'],
    properties: {
        entryId: {
            type: 'string',
        },
        hash: {
            type: 'string',
        },
    },
});

interface GetStateArgs {
    entryId: string;
    hash: string;
}

export const getState = async (
    {ctx, trx}: ServiceArgs,
    args: GetStateArgs,
    skipValidation = false,
) => {
    const targetTrx = trx ?? State.replica;

    const {entryId, hash} = args;

    const {tenantId} = ctx.get('info');

    ctx.log('GET_STATE_REQUEST', {tenantId, entryId, hash});

    if (!skipValidation) {
        validateArgs(args);
    }

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
