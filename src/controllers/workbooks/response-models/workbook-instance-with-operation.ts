import {z} from '../../../components/zod';
import type {Operation} from '../../../entities/types';
import type {WorkbookInstance} from '../../../registry/common/entities/workbook/types';

import {workbookInstance as originalWorkbookInstance} from './workbook-instance';

const schema = originalWorkbookInstance.schema
    .merge(
        z.object({
            operation: z
                .object({
                    id: z.string(),
                    description: z.string(),
                    createdBy: z.string(),
                    createdAt: z.object({
                        nanos: z.number().optional(),
                        seconds: z.string(),
                    }),
                    modifiedAt: z.object({
                        nanos: z.number().optional(),
                        seconds: z.string(),
                    }),
                    metadata: z.object({}),
                    done: z.boolean(),
                })
                .optional(),
        }),
    )
    .describe('Workbook instance with operation');

const format = (
    workbookInstance: WorkbookInstance,
    operation?: Operation,
): z.infer<typeof schema> => {
    return {
        ...originalWorkbookInstance.format(workbookInstance),
        operation: operation
            ? {
                  id: operation.id,
                  description: 'Datalens operation',
                  createdBy: '',
                  createdAt: operation.createdAt,
                  modifiedAt: operation.modifiedAt,
                  metadata: {},
                  done: operation.done,
              }
            : undefined,
    };
};

export const workbookInstanceWithOperation = {
    schema,
    format,
};
