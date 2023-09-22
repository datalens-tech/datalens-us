import {formatWorkbookModel} from './format-workbook-model';
import {formatOperation, Operation} from '../../formatters/format-operation';
import {WorkbookModel} from '../../../../db/models/new/workbook';

export const formatWorkbookModelWithOperation = (
    workbookModel: WorkbookModel,
    operation?: unknown,
) => {
    return {
        ...formatWorkbookModel(workbookModel),
        operation: operation ? formatOperation(operation as Operation) : undefined,
    };
};
