import {z} from '../../components/zod';
import type {Operation} from '../../entities/types';

const schema = z
    .object({
        id: z.string(),
        description: z.string(),
        createdBy: z.string(),
        createdAt: z.object({
            nanos: z.number().optional(),
            seconds: z.union([z.string(), z.number()]),
        }),
        modifiedAt: z.object({
            nanos: z.number().optional(),
            seconds: z.union([z.string(), z.number()]),
        }),
        metadata: z.object({}),
        done: z.boolean(),
        result: z.unknown().optional(),
        response: z.unknown().optional(),
        error: z.unknown().optional(),
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
        done: operation.done ?? true,
        ...(operation.result ? {result: operation.result} : {}),
        ...(operation.response ? {response: operation.response} : {}),
        ...(operation.error ? {error: operation.error} : {}),
    };
};

export const operation = {
    schema,
    format,
};
