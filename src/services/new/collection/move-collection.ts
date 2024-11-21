import {AppError} from '@gravity-ui/nodekit';
import {getCollection} from './get-collection';
import {checkCollectionByTitle} from './check-collection-by-title';
import {getParentIds} from './utils/get-parents';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {CURRENT_TIMESTAMP, US_ERRORS} from '../../../const';
import {OrganizationPermission, ProjectPermission} from '../../../components/iam';
import {raw} from 'objection';
import {CollectionModel, CollectionModelColumn} from '../../../db/models/new/collection';
import Utils from '../../../utils';
import {CollectionPermission} from '../../../entities/collection';
import {Feature, isEnabledFeature} from '../../../components/features';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['collectionId', 'parentId'],
    properties: {
        collectionId: {
            type: 'string',
        },
        parentId: {
            type: ['string', 'null'],
        },
        title: {
            type: 'string',
        },
    },
});

export interface MoveCollectionArgs {
    collectionId: string;
    parentId: Nullable<string>;
    title?: string;
}

export const moveCollection = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: MoveCollectionArgs,
) => {
    const {collectionId, parentId: newParentId, title: newTitle} = args;

    const {accessServiceEnabled} = ctx.config;

    const {
        user: {userId},
    } = ctx.get('info');
    const registry = ctx.get('registry');

    ctx.log('MOVE_COLLECTION_START', {
        collectionId: Utils.encodeId(collectionId),
        newParentId: Utils.encodeId(newParentId),
        newTitle,
    });

    if (!skipValidation) {
        validateArgs(args);
    }

    const targetTrx = getPrimary(trx);

    const collection = await getCollection(
        {ctx, trx: targetTrx, skipValidation: true, skipCheckPermissions: true},
        {collectionId},
    );

    const {Collection} = registry.common.classes.get();
    const {checkOrganizationPermission, checkProjectPermission} = registry.common.functions.get();

    let newParentCollection: Optional<InstanceType<typeof Collection>>;
    let newParentParentIds: string[] = [];

    if (newParentId) {
        newParentCollection = await getCollection(
            {ctx, trx: targetTrx, skipValidation: true, skipCheckPermissions: true},
            {collectionId: newParentId},
        );

        if (newParentCollection.model.parentId !== null) {
            newParentParentIds = await getParentIds({
                ctx,
                trx: targetTrx,
                collectionId: newParentCollection.model.parentId,
            });
        }

        if (newParentId === collectionId) {
            throw new AppError('The collection cannot be a parent of itself', {
                code: US_ERRORS.COLLECTION_CIRCULAR_REFERENCE_ERROR,
            });
        }

        if (newParentParentIds.includes(collectionId)) {
            throw new AppError(
                `The new parent collection ${Utils.encodeId(
                    newParentId,
                )} is a child of the current one – ${Utils.encodeId(collectionId)}`,
                {
                    code: US_ERRORS.COLLECTION_CIRCULAR_REFERENCE_ERROR,
                },
            );
        }
    }

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
            permission: CollectionPermission.Move,
        });

        if (newParentCollection) {
            await newParentCollection.checkPermission({
                parentIds: newParentParentIds,
                permission: CollectionPermission.CreateCollection,
            });
        } else if (isEnabledFeature(ctx, Feature.ProjectsEnabled)) {
            await checkProjectPermission({
                ctx,
                permission: ProjectPermission.CreateCollectionInRoot,
            });
        } else {
            await checkOrganizationPermission({
                ctx,
                permission: OrganizationPermission.CreateCollectionInRoot,
            });
        }
    }

    const titleForPatch = newTitle ?? collection.model.title;

    const checkCollectionByTitleResult = await checkCollectionByTitle(
        {
            ctx,
            trx: targetTrx,
            skipValidation: true,
            skipCheckPermissions,
        },
        {
            title: titleForPatch,
            parentId: newParentId,
        },
    );

    if (checkCollectionByTitleResult === true) {
        throw new AppError(US_ERRORS.COLLECTION_ALREADY_EXISTS, {
            code: US_ERRORS.COLLECTION_ALREADY_EXISTS,
        });
    }

    const patchedCollection = await CollectionModel.query(targetTrx)
        .patch({
            [CollectionModelColumn.Title]: titleForPatch,
            [CollectionModelColumn.TitleLower]: titleForPatch.toLowerCase(),
            [CollectionModelColumn.ParentId]: newParentId,
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

    ctx.log('MOVE_COLLECTION_FINISH', {
        collectionId: Utils.encodeId(patchedCollection.collectionId),
    });

    return patchedCollection;
};
