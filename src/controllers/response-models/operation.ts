import {z} from '../../components/zod';
import type {Operation} from '../../entities/types';

const schema = z
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
    .describe('Operation');

type OperationResponseModel = z.infer<typeof schema>;

const format = (operation: Operation): OperationResponseModel => {
    return {
        id: operation.id,
        description: 'Datalens operation',
        createdBy: '',
        createdAt: operation.createdAt,
        modifiedAt: operation.modifiedAt,
        metadata: {},
        done: operation.done,
    };
};

export const operation = {
    schema,
    format,
};
