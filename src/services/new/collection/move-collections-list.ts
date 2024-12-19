import {transaction} from 'objection';

import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';

import {moveCollection} from './move-collection';

export interface MoveListCollectionsArgs {
    collectionIds: string[];
    parentId: Nullable<string>;
}

export const moveCollectionsList = async (
    {ctx, trx, skipCheckPermissions = false}: ServiceArgs,
    args: MoveListCollectionsArgs,
) => {
    const {collectionIds, parentId} = args;

    const targetTrx = getPrimary(trx);

    ctx.log('MOVE_LIST_COLLECTIONS_START', {
        collectionIds: await Utils.macrotasksMap(collectionIds, (id) => Utils.encodeId(id)),
        parentId: Utils.encodeId(parentId),
    });

    const result = await transaction(targetTrx, async (transactionTrx) => {
        return await Promise.all(
            collectionIds.map(
                async (collectionId: string) =>
                    await moveCollection(
                        {
                            ctx,
                            trx: transactionTrx,
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
