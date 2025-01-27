import {z} from '../../../components/zod';
import type {Operation} from '../../../entities/types';
import type {CollectionInstance} from '../../../registry/common/entities/collection/types';
import {operation as operationResponseModel} from '../../response-models';

import {collectionInstance as originalCollectionInstance} from './collection-instance';

const schema = originalCollectionInstance.schema
    .merge(
        z.object({
            operation: operationResponseModel.schema.optional(),
        }),
    )
    .describe('Collection instance with operation');

const format = (
    collectionInstance: CollectionInstance,
    operation?: Operation,
): z.infer<typeof schema> => {
    return {
        ...originalCollectionInstance.format(collectionInstance),
        operation: operation ? operationResponseModel.format(operation) : undefined,
    };
};

export const collectionInstanceWithOperation = {
    schema,
    format,
};
