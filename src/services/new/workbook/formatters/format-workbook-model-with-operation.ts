import {WorkbookModel} from '../../../../db/models/new/workbook';
import {Operation, formatOperation} from '../../formatters/format-operation';

import {formatWorkbookModel} from './format-workbook-model';

export const formatWorkbookModelWithOperation = (
    workbookModel: WorkbookModel,
    operation?: unknown,
) => {
    return {
        ...formatWorkbookModel(workbookModel),
        operation: operation ? formatOperation(operation as Operation) : undefined,
    };
};
