import {formatWorkbook} from './format-workbook';
import {formatOperation, Operation} from '../../formatters/format-operation';
import type {WorkbookInstance} from '../../../../registry/common/entities/workbook/types';

export const formatWorkbookWithOperation = (workbook: WorkbookInstance, operation?: unknown) => {
    return {
        ...formatWorkbook(workbook),
        operation: operation ? formatOperation(operation as Operation) : undefined,
    };
};
