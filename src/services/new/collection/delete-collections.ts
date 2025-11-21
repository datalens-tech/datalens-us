import {AppError} from '@gravity-ui/nodekit';
import {transaction} from 'objection';

import {US_ERRORS} from '../../../const';
import {CollectionModel, CollectionModelColumn} from '../../../db/models/new/collection';
import {EntryColumn, Entry as EntryModel} from '../../../db/models/new/entry';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import {CollectionPermission} from '../../../entities/collection';
import Utils from '../../../utils';
import {deleteSharedEntries} from '../entry/delete-shared-entries';
import {ServiceArgs} from '../types';
import {getPrimary, getReplica} from '../utils';
import {deleteWorkbooks} from '../workbook';

import {getCollectionsListByIds} from './get-collections-list-by-ids';
import {checkAndSetCollectionPermission, makeCollectionsWithParentsMap} from './utils';
import {markCollectionsAsDeleted} from './utils/mark-collections-as-deleted';

export interface DeleteCollectionArgs {
    collectionIds: string[];
}

export const deleteCollections = async (
    {ctx, trx, checkLicense, skipCheckPermissions = false}: ServiceArgs,
    args: DeleteCollectionArgs,
) => {
    const {collectionIds} = args;

    const {tenantId, isPrivateRoute} = ctx.get('info');

    ctx.log('DELETE_COLLECTIONS_START', {
        collectionIds: await Utils.macrotasksMap(collectionIds, (id) => Utils.encodeId(id)),
    });

    const targetTrx = getPrimary(trx);

    const registry = ctx.get('registry');

    const {fetchAndValidateLicenseOrFail} = registry.common.functions.get();

    if (checkLicense && !isPrivateRoute) {
        await fetchAndValidateLicenseOrFail({ctx});
    }

    const collectionsInstances = await getCollectionsListByIds(
        {ctx, trx: getReplica(trx), skipCheckPermissions: true},
        {collectionIds},
    );

    await Promise.all(
        collectionsInstances.map(async (collectionInstance) => {
            const collection = await checkAndSetCollectionPermission(
                {ctx, trx},
                {
                    collectionInstance,
                    skipCheckPermissions,
                    includePermissionsInfo: false,
                    permission: CollectionPermission.Delete,
                },
            );

            return collection;
        }),
    );

    const recursiveName = 'collectionChildren';

    const collectionsForDelete = await CollectionModel.query(getReplica(trx))
        .withRecursive(recursiveName, (qb1) => {
            qb1.select()
                .from(CollectionModel.tableName)
                .where({
                    [CollectionModelColumn.TenantId]: tenantId,
                    [CollectionModelColumn.DeletedAt]: null,
                })
                .whereIn([CollectionModelColumn.CollectionId], collectionIds)
                .union((qb2) => {
                    qb2.select(`${CollectionModel.tableName}.*`)
                        .from(CollectionModel.tableName)
                        .where({
                            [`${CollectionModel.tableName}.${CollectionModelColumn.TenantId}`]:
                                tenantId,
                            [`${CollectionModel.tableName}.${CollectionModelColumn.DeletedAt}`]:
                                null,
                        })
                        .join(
                            recursiveName,
                            `${recursiveName}.${CollectionModelColumn.CollectionId}`,
                            `${CollectionModel.tableName}.${CollectionModelColumn.ParentId}`,
                        );
                });
        })
        .select()
        .from(recursiveName)
        .timeout(CollectionModel.DEFAULT_QUERY_TIMEOUT);

    const collectionsForDeleteIds = collectionsForDelete.map((item) => item.collectionId);

    const collectionsMap = await makeCollectionsWithParentsMap(
        {ctx, trx},
        {models: collectionsForDelete},
    );

    const workbooksForDelete = await WorkbookModel.query(getReplica(trx))
        .select()
        .where(WorkbookModelColumn.CollectionId, 'in', collectionsForDeleteIds)
        .where({
            [WorkbookModelColumn.DeletedAt]: null,
        })
        .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

    for (const workbook of workbooksForDelete) {
        if (workbook.isTemplate) {
            throw new AppError("Collection with workbook template can't be deleted", {
                code: US_ERRORS.COLLECTION_WITH_WORKBOOK_TEMPLATE_CANT_BE_DELETED,
            });
        }
    }

    const workbookIds = workbooksForDelete.map((workbook) => workbook.workbookId);

    const sharedEntriesForDelete = await EntryModel.query(getReplica(trx))
        .select(EntryColumn.EntryId)
        .whereIn(EntryColumn.CollectionId, collectionsForDeleteIds)
        .where({
            [EntryColumn.IsDeleted]: false,
        })
        .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

    const sharedEntriesForDeleteIds = sharedEntriesForDelete.map((entry) => entry.entryId);

    const deletePermissionsFunctions: (() => Promise<void>)[] = [];

    const result = await transaction(targetTrx, async (transactionTrx) => {
        const deletedCollectionsEntitiesPromises = [];

        if (workbookIds.length) {
            deletedCollectionsEntitiesPromises.push(
                deleteWorkbooks(
                    {ctx, trx: transactionTrx, skipCheckPermissions: true},
                    {
                        workbookIds,
                        detachDeletePermissions: true,
                    },
                ),
            );
        }

        if (sharedEntriesForDeleteIds.length) {
            deletedCollectionsEntitiesPromises.push(
                deleteSharedEntries(
                    {ctx, trx: transactionTrx, skipCheckPermissions: true},
                    {entryIds: sharedEntriesForDeleteIds, detachDeletePermissions: true},
                ),
            );
        }

        const deletedEntitiesArray = await Promise.all(deletedCollectionsEntitiesPromises);

        deletedEntitiesArray.forEach(({deletePermissions}) => {
            if (deletePermissions) {
                deletePermissionsFunctions.push(deletePermissions);
            }
        });

        const deletedCollections = await markCollectionsAsDeleted(
            {ctx, trx: transactionTrx, skipCheckPermissions: true},
            {collectionsMap, detachDeletePermissions: true},
        );

        if (deletedCollections.deletePermissions) {
            deletePermissionsFunctions.push(deletedCollections.deletePermissions);
        }

        return deletedCollections;
    });

    await Promise.all(deletePermissionsFunctions.map((func) => func()));

    ctx.log('DELETE_COLLECTIONS_FINISH', {
        collectionIds: await Utils.macrotasksMap(result.collections, (collection) =>
            Utils.encodeId(collection.collectionId),
        ),
    });

    return {collections: result.collections};
};
