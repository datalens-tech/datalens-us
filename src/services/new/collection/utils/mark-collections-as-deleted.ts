import {raw} from 'objection';

import {CURRENT_TIMESTAMP} from '../../../../const';
import {CollectionModel, CollectionModelColumn} from '../../../../db/models/new/collection';
import {CollectionInstance} from '../../../../registry/common/entities/collection/types';
import {ServiceArgs} from '../../types';
import {getPrimary} from '../../utils';

export const markCollectionsAsDeleted = async (
    {ctx, trx, skipCheckPermissions}: ServiceArgs,
    {collectionsMap}: {collectionsMap: Map<CollectionInstance, string[]>},
) => {
    const collectionIds: string[] = [];

    collectionsMap.forEach((parentIds, collectionInstance) => {
        collectionIds.push(collectionInstance.model.collectionId);
    });

    const {
        user: {userId},
    } = ctx.get('info');

    const deletedCollections = await CollectionModel.query(getPrimary(trx))
        .patch({
            [CollectionModelColumn.DeletedBy]: userId,
            [CollectionModelColumn.DeletedAt]: raw(CURRENT_TIMESTAMP),
        })
        .where(CollectionModelColumn.CollectionId, 'in', collectionIds)
        .andWhere({
            [CollectionModelColumn.DeletedAt]: null,
        })
        .returning('*')
        .timeout(CollectionModel.DEFAULT_QUERY_TIMEOUT);

    const deletePermissionsPromises: Promise<void>[] = [];

    collectionsMap.forEach((parentIds, collectionInstance) => {
        deletePermissionsPromises.push(
            collectionInstance.deletePermissions({
                parentIds,
                skipCheckPermissions,
            }),
        );
    });

    await Promise.all(deletePermissionsPromises);

    return deletedCollections;
};
