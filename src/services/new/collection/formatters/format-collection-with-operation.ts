import {formatCollection} from './format-collection';
import {formatOperation, Operation} from '../../formatters/format-operation';
import type {CollectionInstance} from '../../../../registry/common/entities/collection/types';

export const formatCollectionWithOperation = (
    collection: CollectionInstance,
    operation: unknown,
) => {
    return {
        ...formatCollection(collection),
        operation: operation ? formatOperation(operation as Operation) : undefined,
    };
};
