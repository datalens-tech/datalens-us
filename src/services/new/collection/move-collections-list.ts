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

    const ids = await Utils.macrotasksMap(collectionIds, (id) => Utils.decodeId(id));

    const result = await transaction(targetTrx, async (transactionTrx) => {
        return await Promise.all(
            ids.map(
                async (collectionId: string) =>
                    await moveCollection(
                        {
                            ctx,
                            trx: transactionTrx,
                            skipValidation,
                            skipCheckPermissions,
                        },
                        {
                            collectionId,
                            parentId,
                        },
                    ),
            ),
        );
    });

    ctx.log('MOVE_LIST_COLLECTIONS_END', {
        collectionIds: await Utils.macrotasksMap(result, (collection) =>
            Utils.encodeId(collection.collectionId),
        ),
        parentId: Utils.encodeId(parentId),
    });

    return {
        collections: result,
    };
};
