import {WorkbookModel} from '../../../../db/models/new/workbook';

export const formatSetWorkbookIsTemplate = (workbookModel: WorkbookModel) => {
    return {
        workbookId: workbookModel.workbookId,
        isTemplate: workbookModel.isTemplate,
    };
};
