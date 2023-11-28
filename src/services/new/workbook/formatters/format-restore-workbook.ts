import {WorkbookModel} from '../../../../db/models/new/workbook';

export const formatRestoreWorkbook = (workbookModel: WorkbookModel) => {
    return {
        workbookId: workbookModel.workbookId,
    };
};
