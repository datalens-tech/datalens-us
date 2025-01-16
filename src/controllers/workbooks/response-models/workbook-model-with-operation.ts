import {z} from '../../../components/zod';
import {WorkbookModel} from '../../../db/models/new/workbook';
import type {Operation} from '../../../entities/types';

import {workbookModel as originalWorkbookModel} from './workbook-model';

const schema = originalWorkbookModel.schema
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
    .describe('Workbook model with operation');

const format = (workbookModel: WorkbookModel, operation?: Operation): z.infer<typeof schema> => {
    return {
        ...originalWorkbookModel.format(workbookModel),
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

export const workbookModelWithOperation = {
    schema,
    format,
};
