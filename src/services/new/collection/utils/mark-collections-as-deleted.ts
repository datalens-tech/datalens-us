import {AppError} from '@gravity-ui/nodekit';
import {raw} from 'objection';

import {CURRENT_TIMESTAMP, US_ERRORS} from '../../../../const';
import {CollectionModel, CollectionModelColumn} from '../../../../db/models/new/collection';
import {CollectionInstance} from '../../../../registry/plugins/common/entities/collection/types';
import {ServiceArgs} from '../../types';
import {getPrimary} from '../../utils';

type MarkCollectionsAsDeletedArgs = {
    collectionsMap: Map<CollectionInstance, string[]>;
    skipDeletePermissions?: boolean;
};

export const markCollectionsAsDeleted = async (
    {ctx, trx, skipCheckPermissions}: ServiceArgs,
    {collectionsMap, skipDeletePermissions = false}: MarkCollectionsAsDeletedArgs,
) => {
    const collectionIds: string[] = [];
    const collectionIdsMap = new Map<
        string,
        {collectionInstance: CollectionInstance; parentIds: string[]}
    >();

    collectionsMap.forEach((parentIds, collectionInstance) => {
        collectionIds.push(collectionInstance.model.collectionId);
        collectionIdsMap.set(collectionInstance.model.collectionId, {
            collectionInstance,
            parentIds,
        });
    });

    const {
        user: {userId},
    } = ctx.get('info');

    const collections = await CollectionModel.query(getPrimary(trx))
        .patch({
            [CollectionModelColumn.DeletedBy]: userId,
            [CollectionModelColumn.DeletedAt]: raw(CURRENT_TIMESTAMP),
        })
        .whereIn(CollectionModelColumn.CollectionId, collectionIds)
        .andWhere({
            [CollectionModelColumn.DeletedAt]: null,
        })
        .returning('*')
        .timeout(CollectionModel.DEFAULT_QUERY_TIMEOUT);

    const deletePermissions = async () => {
        await Promise.all(
            collections.map(async ({collectionId}) => {
                const collectionData = collectionIdsMap.get(collectionId);
                if (!collectionData) {
                    throw new AppError(US_ERRORS.COLLECTION_NOT_EXISTS, {
                        code: US_ERRORS.COLLECTION_NOT_EXISTS,
                    });
                }
                const {collectionInstance, parentIds} = collectionData;
                await collectionInstance.deletePermissions({
                    parentIds,
                    skipCheckPermissions,
                });
            }),
        );
    };

    if (!skipDeletePermissions) {
        await deletePermissions();
    }

    return {
        collections,
        deletePermissions: skipDeletePermissions ? deletePermissions : undefined,
    };
};
