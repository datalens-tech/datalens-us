import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';
import {deleteWorkbooks} from '../workbook';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {CURRENT_TIMESTAMP, US_ERRORS} from '../../../const';
import {raw, transaction} from 'objection';
import {CollectionModel, CollectionModelColumn} from '../../../db/models/new/collection';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import Utils, {logInfo} from '../../../utils';
import {CollectionPermission} from '../../../entities/collection';
import {AppError} from '@gravity-ui/nodekit';
import {getCollectionsListByIds} from './get-collections-list-by-ids';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['collectionIds'],
    properties: {
        collectionIds: {
            type: 'array',
            items: {type: 'string'},
        },
    },
});

export interface DeleteCollectionArgs {
    collectionIds: string[];
}

export const deleteCollections = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: DeleteCollectionArgs,
) => {
    const {collectionIds} = args;

    const {
        tenantId,
        projectId,
        user: {userId},
    } = ctx.get('info');

    logInfo(ctx, 'DELETE_COLLECTIONS_START', {
        collectionIds,
    });

    if (!skipValidation) {
        validateArgs(args);
    }

    const ids = await Utils.macrotasksMap(collectionIds, (id) => Utils.decodeId(id));

    const targetTrx = getPrimary(trx);

    await getCollectionsListByIds(
        {ctx, trx: targetTrx, skipValidation, skipCheckPermissions},
        {collectionIds: ids, permission: CollectionPermission.Delete},
    );

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
                    })
                    .whereIn([CollectionModelColumn.CollectionId], ids)
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

        const workbookIds = workbooksForDelete.map((workbook) => workbook.workbookId);
        const preparedWorkbookIds = await Utils.macrotasksMap(workbookIds, (id) =>
            Utils.encodeId(id),
        );

        await deleteWorkbooks(
            {ctx, trx: transactionTrx},
            {
                workbookIds: preparedWorkbookIds,
            },
        );

        const deletedCollections = await CollectionModel.query(transactionTrx)
            .patch({
                [CollectionModelColumn.DeletedBy]: userId,
                [CollectionModelColumn.DeletedAt]: raw(CURRENT_TIMESTAMP),
            })
            .where(CollectionModelColumn.CollectionId, 'in', collectionsForDeleteIds)
            .andWhere({
                [CollectionModelColumn.DeletedAt]: null,
            })
            .returning('*')
            .timeout(CollectionModel.DEFAULT_QUERY_TIMEOUT);

        return deletedCollections;
    });

    ctx.log('DELETE_COLLECTIONS_FINISH', {
        collectionIds,
    });

    // TODO: Return deleted workbooks and entries
    return {collections: result};
};
