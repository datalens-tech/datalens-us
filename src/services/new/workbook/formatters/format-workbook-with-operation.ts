import type {WorkbookInstance} from '../../../../registry/common/entities/workbook/types';
import {Operation, formatOperation} from '../../formatters/format-operation';

import {formatWorkbook} from './format-workbook';

export const formatWorkbookWithOperation = (workbook: WorkbookInstance, operation?: unknown) => {
    return {
        ...formatWorkbook(workbook),
        operation: operation ? formatOperation(operation as Operation) : undefined,
    };
};
