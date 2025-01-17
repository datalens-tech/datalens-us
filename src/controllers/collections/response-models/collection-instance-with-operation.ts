import {z} from '../../../components/zod';
import type {Operation} from '../../../entities/types';
import type {CollectionInstance} from '../../../registry/common/entities/collection/types';

import {collectionInstance as originalCollectionInstance} from './collection-instance';

const schema = originalCollectionInstance.schema
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
    .describe('Collection instance with operation');

const format = (
    collectionInstance: CollectionInstance,
    operation?: Operation,
): z.infer<typeof schema> => {
    return {
        ...originalCollectionInstance.format(collectionInstance),
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

export const collectionInstanceWithOperation = {
    schema,
    format,
};
