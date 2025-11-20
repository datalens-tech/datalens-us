import {AppError} from '@gravity-ui/nodekit';
import {transaction} from 'objection';

import {US_ERRORS} from '../../../const';
import {CollectionModel, CollectionModelColumn} from '../../../db/models/new/collection';
import {Operation} from '../../../entities/types';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';

import {checkCollectionByTitle} from './check-collection-by-title';
import {getParentIds} from './utils/get-parents';

export interface CreateCollectionArgs {
    title: string;
    description?: string;
    parentId: Nullable<string>;
}

export const createCollection = async (
    {ctx, trx, checkLicense, skipCheckPermissions = false}: ServiceArgs,
    args: CreateCollectionArgs,
) => {
    const {title, description, parentId} = args;

    const registry = ctx.get('registry');

    ctx.log('CREATE_COLLECTION_START', {
        title,
        description,
        parentId: parentId ? Utils.encodeId(parentId) : null,
    });

    const {
        user: {userId},
        tenantId,
        isPrivateRoute,
    } = ctx.get('info');

    if (!isPrivateRoute && checkLicense) {
        const {fetchAndValidateLicenseOrFail} = registry.common.functions.get();
        await fetchAndValidateLicenseOrFail({ctx});
    }

    const {accessServiceEnabled, accessBindingsServiceEnabled} = ctx.config;

    const targetTrx = getPrimary(trx);

    let parentIds: string[] = [];

    if (parentId !== null) {
        parentIds = await getParentIds({ctx, trx: targetTrx, collectionId: parentId});

        if (parentIds.length === 0) {
            throw new AppError(
                `Cannot find parent collection with id – ${Utils.encodeId(parentId)}`,
                {
                    code: US_ERRORS.COLLECTION_NOT_EXISTS,
                },
            );
        }
    }

    const checkCollectionByTitleResult = await checkCollectionByTitle(
        {
            ctx,
            trx: targetTrx,
            skipValidation: true,
            skipCheckPermissions: skipCheckPermissions || accessBindingsServiceEnabled,
        },
        {
            title,
            parentId,
        },
    );

    if (checkCollectionByTitleResult === true) {
        throw new AppError(`Collection with title "${title}" already exists in this scope`, {
            code: US_ERRORS.COLLECTION_ALREADY_EXISTS,
        });
    }

    let operation: Operation | undefined;

    const result = await transaction(targetTrx, async (transactionTrx) => {
        ctx.log('CREATE_COLLECTION_IN_DB_START');

        const model = await CollectionModel.query(transactionTrx)
            .insert({
                [CollectionModelColumn.Title]: title,
                [CollectionModelColumn.TitleLower]: title.toLowerCase(),
                [CollectionModelColumn.Description]: description ?? null,
                [CollectionModelColumn.ParentId]: parentId,
                [CollectionModelColumn.TenantId]: tenantId,
                [CollectionModelColumn.CreatedBy]: userId,
                [CollectionModelColumn.UpdatedBy]: userId,
            })
            .returning('*')
            .timeout(CollectionModel.DEFAULT_QUERY_TIMEOUT);

        ctx.log('CREATE_COLLECTION_IN_DB_FINISH', {
            collectionId: Utils.encodeId(model.collectionId),
        });

        const {Collection} = registry.common.classes.get();

        const collection = new Collection({
            ctx,
            model,
        });

        if (accessServiceEnabled && accessBindingsServiceEnabled && !isPrivateRoute) {
            operation = await collection.register({
                parentIds,
            });
        }

        return collection;
    });

    ctx.log('CREATE_COLLECTION_FINISH', {
        collectionId: Utils.encodeId(result.model.collectionId),
    });

    return {
        collection: result,
        operation,
    };
};
