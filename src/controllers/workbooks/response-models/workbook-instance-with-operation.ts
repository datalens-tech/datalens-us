import {z} from '../../../components/zod';
import type {Operation} from '../../../entities/types';
import type {WorkbookInstance} from '../../../registry/plugins/common/entities/workbook/types';
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

const format = ({
    workbook,
    operation,
    includePermissionsInfo,
}: {
    workbook: WorkbookInstance;
    operation?: Operation;
    includePermissionsInfo?: boolean;
}): WorkbookInstanceWithOperationResponseModel => {
    return {
        ...originalWorkbookInstance.format({workbook, includePermissionsInfo}),
        operation: operation ? operationResponseModel.format(operation) : undefined,
    };
};

export const workbookInstanceWithOperation = {
    schema,
    format,
};
