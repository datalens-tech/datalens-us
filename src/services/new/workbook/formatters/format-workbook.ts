import type {WorkbookInstance} from '../../../../registry/common/entities/workbook/types';

export const formatWorkbook = (workbook: WorkbookInstance) => {
    return {
        workbookId: workbook.model.workbookId,
        collectionId: workbook.model.collectionId,
        title: workbook.model.title,
        description: workbook.model.description,
        projectId: workbook.model.projectId,
        tenantId: workbook.model.tenantId,
        meta: workbook.model.meta,
        createdBy: workbook.model.createdBy,
        createdAt: workbook.model.createdAt,
        updatedBy: workbook.model.updatedBy,
        updatedAt: workbook.model.updatedAt,
        permissions: workbook.permissions,
    };
};
