import {ServiceArgs} from '../types';
import {logInfo} from '../../../utils';
import hashGenerator from '../../../components/hash-generator';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {State} from '../../../db/models/new/state';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['entryId', 'data'],
    properties: {
        entryId: {
            type: 'string',
        },
        data: {
            type: 'object',
        },
    },
});

interface CreateStateArgs {
    entryId: string;
    data: Record<string, unknown>;
}

export const createState = async (
    {ctx, trx}: ServiceArgs,
    args: CreateStateArgs,
    skipValidation = false,
) => {
    const targetTrx = trx ?? State.primary;

    const {entryId, data} = args;

    const {tenantId} = ctx.get('info');

    logInfo(ctx, 'CREATE_STATE_REQUEST', {tenantId, entryId});

    if (!skipValidation) {
        validateArgs(args);
    }

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
            hash,
            entryId,
            data,
        })
        .returning('*')
        .timeout(State.DEFAULT_QUERY_TIMEOUT);

    logInfo(ctx, 'CREATE_STATE_SUCCESS');

    return state;
};
