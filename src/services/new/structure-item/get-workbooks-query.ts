import {getReplica} from '../utils';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {raw} from 'objection';

interface GetWorkbooksQueryArgs {
    collectionId: Nullable<string>;
    filterString?: string;
    onlyMy?: boolean;
}

export const getWorkbooksQuery = ({ctx, trx}: ServiceArgs, args: GetWorkbooksQueryArgs) => {
    const {filterString, onlyMy, collectionId} = args;
    const {
        tenantId,
        projectId,
        user: {userId},
    } = ctx.get('info');

    const targetTrx = getReplica(trx);
    return WorkbookModel.query(targetTrx)
        .select({
            type: raw("'workbook'"),
            workbookId: WorkbookModelColumn.WorkbookId,
            collectionId: WorkbookModelColumn.CollectionId,
            title: WorkbookModelColumn.Title,
            sortTitle: WorkbookModelColumn.SortTitle,
            description: WorkbookModelColumn.Description,
            parentId: raw('null'),
            projectId: WorkbookModelColumn.ProjectId,
            tenantId: WorkbookModelColumn.TenantId,
            createdBy: WorkbookModelColumn.CreatedBy,
            createdAt: WorkbookModelColumn.CreatedAt,
            updatedBy: WorkbookModelColumn.UpdatedBy,
            updatedAt: WorkbookModelColumn.UpdatedAt,
            meta: WorkbookModelColumn.Meta,
        })
        .where({
            [WorkbookModelColumn.TenantId]: tenantId,
            [WorkbookModelColumn.ProjectId]: projectId,
            [WorkbookModelColumn.CollectionId]: collectionId,
            [WorkbookModelColumn.DeletedAt]: null,
        })
        .where((qb) => {
            if (filterString) {
                const preparedFilterString = Utils.escapeStringForLike(filterString.toLowerCase());
                qb.where(WorkbookModelColumn.TitleLower, 'LIKE', `%${preparedFilterString}%`);
            }
            if (onlyMy) {
                qb.where({
                    [WorkbookModelColumn.CreatedBy]: userId,
                });
            }
        });
};
