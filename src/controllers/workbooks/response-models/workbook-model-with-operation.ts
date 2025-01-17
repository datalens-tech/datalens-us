import {z} from '../../../components/zod';
import {WorkbookModel} from '../../../db/models/new/workbook';
import type {Operation} from '../../../entities/types';
import {operation as operationResponseModel} from '../../response-models';

import {workbookModel as originalWorkbookModel} from './workbook-model';

const schema = originalWorkbookModel.schema
    .merge(
        z.object({
            operation: operationResponseModel.schema.optional(),
        }),
    )
    .describe('Workbook model with operation');

export type WorkbookModelWithOperationResponseModel = z.infer<typeof schema>;

const format = (
    workbookModel: WorkbookModel,
    operation?: Operation,
): WorkbookModelWithOperationResponseModel => {
    return {
        ...originalWorkbookModel.format(workbookModel),
        operation: operation ? operationResponseModel.format(operation) : undefined,
    };
};

export const workbookModelWithOperation = {
    schema,
    format,
};
