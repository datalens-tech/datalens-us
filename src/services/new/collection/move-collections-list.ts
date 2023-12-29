import {getPrimary} from '../utils';
import {transaction} from 'objection';

import {ServiceArgs} from '../types';

import {makeSchemaValidator} from '../../../components/validation-schema-compiler';

import Utils, {logInfo} from '../../../utils';

import {moveCollection} from './move-collection';

export interface MoveListCollectionsArgs {
    collectionIds: string[];
    parentId: Nullable<string>;
}

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['collectionIds', 'parentId'],
    properties: {
        collectionIds: {
            type: 'array',
            items: {type: 'string'},
        },
        parentId: {
            type: ['string', 'null'],
        },
    },
});

export const moveCollectionsList = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: MoveListCollectionsArgs,
) => {
    const {collectionIds, parentId} = args;

    if (!skipValidation) {
        validateArgs(args);
    }

    const targetTrx = getPrimary(trx);

    logInfo(ctx, 'MOVE_LIST_COLLECTIONS_START', {
        collectionIds,
        parentId: Utils.encodeId(parentId),
    });

    const result = await transaction(targetTrx, async (transactionTrx) => {
        return await Promise.all(
            collectionIds.map(
                async (id: string) =>
                    await moveCollection(
                        {
                            ctx,
                            trx: transactionTrx,
                            skipValidation,
                            skipCheckPermissions,
                        },
                        {
                            collectionId: Utils.decodeId(id),
                            parentId,
                        },
                    ),
            ),
        );
    });

    ctx.log('MOVE_LIST_COLLECTIONS_END', {
        collectionIds: result.map((collection) => Utils.encodeId(collection.collectionId)),
        parentId: Utils.encodeId(parentId),
    });

    return {
        collections: result,
    };
};
