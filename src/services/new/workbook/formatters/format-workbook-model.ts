import {WorkbookModel} from '../../../../db/models/new/workbook';

export const formatWorkbookModel = (workbookModel: WorkbookModel) => {
    return {
        workbookId: workbookModel.workbookId,
        collectionId: workbookModel.collectionId,
        title: workbookModel.title,
        description: workbookModel.description,
        tenantId: workbookModel.tenantId,
        meta: workbookModel.meta,
        createdBy: workbookModel.createdBy,
        createdAt: workbookModel.createdAt,
        updatedBy: workbookModel.updatedBy,
        updatedAt: workbookModel.updatedAt,
        status: workbookModel.status,
    };
};
