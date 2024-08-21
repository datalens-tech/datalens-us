import {getReplica} from '../utils';
import {CollectionModel, CollectionModelColumn} from '../../../db/models/new/collection';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {raw} from 'objection';

interface GetCollectionsQueryArgs {
    collectionId: Nullable<string>;
    filterString?: string;
    onlyMy?: boolean;
}

export const getCollectionsQuery = ({ctx, trx}: ServiceArgs, args: GetCollectionsQueryArgs) => {
    const {filterString, onlyMy, collectionId} = args;
    const {
        tenantId,
        projectId,
        user: {userId},
    } = ctx.get('info');

    const targetTrx = getReplica(trx);

    return CollectionModel.query(targetTrx)
        .select({
            type: raw("'collection'"),
            workbookId: raw('null'),
            collectionId: CollectionModelColumn.CollectionId,
            title: CollectionModelColumn.Title,
            sortTitle: CollectionModelColumn.SortTitle,
            description: CollectionModelColumn.Description,
            parentId: CollectionModelColumn.ParentId,
            projectId: CollectionModelColumn.ProjectId,
            tenantId: CollectionModelColumn.TenantId,
            createdBy: CollectionModelColumn.CreatedBy,
            createdAt: CollectionModelColumn.CreatedAt,
            updatedBy: CollectionModelColumn.UpdatedBy,
            updatedAt: CollectionModelColumn.UpdatedAt,
            meta: CollectionModelColumn.Meta,
        })
        .where({
            [CollectionModelColumn.TenantId]: tenantId,
            [CollectionModelColumn.ProjectId]: projectId,
            [CollectionModelColumn.DeletedAt]: null,
            [CollectionModelColumn.ParentId]: collectionId,
        })
        .where((qb) => {
            if (filterString) {
                const preparedFilterString = Utils.escapeStringForLike(filterString.toLowerCase());
                qb.where(CollectionModelColumn.TitleLower, 'LIKE', `%${preparedFilterString}%`);
            }
            if (onlyMy) {
                qb.where({
                    [CollectionModelColumn.CreatedBy]: userId,
                });
            }
        });
};
