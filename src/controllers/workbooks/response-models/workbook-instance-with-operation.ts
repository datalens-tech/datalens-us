import {z} from '../../../components/zod';
import type {Operation} from '../../../entities/types';
import type {WorkbookInstance} from '../../../registry/common/entities/workbook/types';
import {operation as operationResponseModel} from '../../response-models';

import {workbookInstance as originalWorkbookInstance} from './workbook-instance';

const schema = originalWorkbookInstance.schema
    .merge(
        z.object({
            operation: operationResponseModel.schema.optional(),
        }),
    )
    .describe('Workbook instance with operation');

export type WorkbookInstanceWithOperationResponseModel = z.infer<typeof schema>;

const format = (
    workbookInstance: WorkbookInstance,
    operation?: Operation,
): WorkbookInstanceWithOperationResponseModel => {
    return {
        ...originalWorkbookInstance.format(workbookInstance),
        operation: operation ? operationResponseModel.format(operation) : undefined,
    };
};

export const workbookInstanceWithOperation = {
    schema,
    format,
};
