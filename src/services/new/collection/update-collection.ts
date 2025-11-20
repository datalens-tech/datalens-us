import {AppError} from '@gravity-ui/nodekit';
import {raw} from 'objection';

import {CURRENT_TIMESTAMP, US_ERRORS} from '../../../const';
import {CollectionModel, CollectionModelColumn} from '../../../db/models/new/collection';
import {CollectionPermission} from '../../../entities/collection';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';

import {checkCollectionByTitle} from './check-collection-by-title';
import {getCollection} from './get-collection';
import {getParentIds} from './utils/get-parents';

export interface UpdateCollectionArgs {
    collectionId: string;
    title?: string;
    description?: string;
}

export const updateCollection = async (
    {ctx, trx, checkLicense, skipCheckPermissions = false}: ServiceArgs,
    args: UpdateCollectionArgs,
) => {
    const {collectionId, title: newTitle, description: newDescription} = args;

    const {isPrivateRoute} = ctx.get('info');

    const registry = ctx.get('registry');

    const {fetchAndValidateLicenseOrFail} = registry.common.functions.get();

    if (checkLicense && !isPrivateRoute) {
        await fetchAndValidateLicenseOrFail({ctx});
    }

    const {
        user: {userId},
    } = ctx.get('info');

    const {accessServiceEnabled} = ctx.config;

    ctx.log('UPDATE_COLLECTION_START', {
        collectionId: Utils.encodeId(collectionId),
        newTitle,
        newDescription,
    });

    const targetTrx = getPrimary(trx);

    const collection = await getCollection(
        {
            ctx,
            trx: targetTrx,
            skipValidation: true,
            skipCheckPermissions: true,
        },
        {collectionId},
    );

    if (accessServiceEnabled && !skipCheckPermissions) {
        let parentIds: string[] = [];

        if (collection.model.parentId !== null) {
            parentIds = await getParentIds({
                ctx,
                trx: targetTrx,
                collectionId: collection.model.parentId,
            });
        }

        await collection.checkPermission({
            parentIds,
            permission: CollectionPermission.Update,
        });
    }

    if (newTitle && newTitle.toLowerCase() !== collection.model.titleLower) {
        const checkCollectionByTitleResult = await checkCollectionByTitle(
            {
                ctx,
                trx: targetTrx,
                skipValidation: true,
                skipCheckPermissions,
            },
            {
                title: newTitle,
                parentId: collection.model.parentId,
            },
        );

        if (checkCollectionByTitleResult === true) {
            throw new AppError(US_ERRORS.COLLECTION_ALREADY_EXISTS, {
                code: US_ERRORS.COLLECTION_ALREADY_EXISTS,
            });
        }
    }

    const patchedCollection = await CollectionModel.query(targetTrx)
        .patch({
            [CollectionModelColumn.Title]: newTitle,
            [CollectionModelColumn.TitleLower]: newTitle?.toLowerCase(),
            [CollectionModelColumn.Description]: newDescription,
            [CollectionModelColumn.UpdatedBy]: userId,
            [CollectionModelColumn.UpdatedAt]: raw(CURRENT_TIMESTAMP),
        })
        .where({
            [CollectionModelColumn.CollectionId]: collectionId,
        })
        .returning('*')
        .first()
        .timeout(CollectionModel.DEFAULT_QUERY_TIMEOUT);

    if (!patchedCollection) {
        throw new AppError(US_ERRORS.COLLECTION_NOT_EXISTS, {
            code: US_ERRORS.COLLECTION_NOT_EXISTS,
        });
    }

    ctx.log('UPDATE_COLLECTION_FINISH', {
        collectionId: Utils.encodeId(patchedCollection.collectionId),
    });

    return patchedCollection;
};
