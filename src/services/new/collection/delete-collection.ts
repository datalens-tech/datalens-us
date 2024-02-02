import {getCollection} from './get-collection';
import {getParentIds} from './utils/get-parents';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';
import {deleteWorkbook} from '../workbook';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {CURRENT_TIMESTAMP, US_ERRORS} from '../../../const';
import {raw, transaction} from 'objection';
import {CollectionModel, CollectionModelColumn} from '../../../db/models/new/collection';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import Utils, {logInfo} from '../../../utils';
import {CollectionPermission} from '../../../entities/collection';
import {AppError} from '@gravity-ui/nodekit';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['collectionId'],
    properties: {
        collectionId: {
            type: 'string',
        },
    },
});

export interface DeleteCollectionArgs {
    collectionId: string;
}

export const deleteCollection = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: DeleteCollectionArgs,
) => {
    const {collectionId} = args;

    const {
        tenantId,
        projectId,
        user: {userId},
    } = ctx.get('info');

    const {accessServiceEnabled} = ctx.config;

    logInfo(ctx, 'DELETE_COLLECTION_START', {
        collectionId: Utils.encodeId(collectionId),
    });

    if (!skipValidation) {
        validateArgs(args);
    }

    const targetTrx = getPrimary(trx);

    const collection = await getCollection(
        {ctx, trx: targetTrx, skipValidation: true, skipCheckPermissions: true},
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
            permission: CollectionPermission.Delete,
        });
    }

    const result = await transaction(targetTrx, async (transactionTrx) => {
        const recursiveName = 'collectionChildren';

        const collectionsForDelete = await CollectionModel.query(transactionTrx)
            .withRecursive(recursiveName, (qb1) => {
                qb1.select()
                    .from(CollectionModel.tableName)
                    .where({
                        [CollectionModelColumn.TenantId]: tenantId,
                        [CollectionModelColumn.ProjectId]: projectId,
                        [CollectionModelColumn.DeletedAt]: null,
                        [CollectionModelColumn.CollectionId]: collectionId,
                    })
                    .union((qb2) => {
                        qb2.select(`${CollectionModel.tableName}.*`)
                            .from(CollectionModel.tableName)
                            .where({
                                [`${CollectionModel.tableName}.${CollectionModelColumn.TenantId}`]:
                                    tenantId,
                                [`${CollectionModel.tableName}.${CollectionModelColumn.ProjectId}`]:
                                    projectId,
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

        const deletedCollections = await CollectionModel.query(transactionTrx)
            .patch({
                [CollectionModelColumn.DeletedBy]: userId,
                [CollectionModelColumn.DeletedAt]: raw(CURRENT_TIMESTAMP),
            })
            .where(CollectionModelColumn.CollectionId, 'in', collectionsForDeleteIds)
            .where({
                [CollectionModelColumn.DeletedAt]: null,
            })
            .returning('*')
            .timeout(CollectionModel.DEFAULT_QUERY_TIMEOUT);

        const workbooksForDelete = await WorkbookModel.query(transactionTrx)
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

        // TODO: Rewrite the deletion for the optimal number of requests
        await Promise.all(
            workbooksForDelete.map((workbook) => {
                return deleteWorkbook(
                    {ctx, trx: transactionTrx},
                    {
                        workbookId: workbook.workbookId,
                    },
                );
            }),
        );

        return deletedCollections;
    });

    logInfo(ctx, 'DELETE_COLLECTION_FINISH', {
        deletedCollections: result.map((item) => Utils.encodeId(item.collectionId)),
    });

    // TODO: Return deleted workbooks and entries
    return {collections: result};
};
