import {getPrimary} from '../utils';
import {transaction} from 'objection';

import {ServiceArgs} from '../types';

import {makeSchemaValidator} from '../../../components/validation-schema-compiler';

import Utils, {logInfo} from '../../../utils';

import {deleteCollection} from './delete-collection';

export interface DeleteListCollectionsArgs {
    collectionIds: string[];
}

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['collectionIds'],
    properties: {
        collectionIds: {
            type: 'array',
            items: {type: 'string'},
        },
    },
});

export const deleteCollectionsList = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: DeleteListCollectionsArgs,
) => {
    const {collectionIds} = args;

    if (!skipValidation) {
        validateArgs(args);
    }

    const targetTrx = getPrimary(trx);

    logInfo(ctx, 'DELETE_LIST_COLLECTIONS_START', {
        collectionIds,
    });

    const result = await transaction(targetTrx, async (transactionTrx) => {
        return await Promise.all(
            collectionIds.map(
                async (id: string) =>
                    await deleteCollection(
                        {
                            ctx,
                            trx: transactionTrx,
                            skipValidation,
                            skipCheckPermissions,
                        },
                        {
                            collectionId: Utils.decodeId(id),
                        },
                    ),
            ),
        );
    });

    ctx.log('DELETE_COLLECTIONS_LIST_END', {
        collectionIds: collectionIds.map((collectionId) => Utils.encodeId(collectionId)),
    });

    return {
        collections: result,
    };
};
