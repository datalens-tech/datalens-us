import type {CollectionInstance} from '../../../../registry/common/entities/collection/types';
import {Operation, formatOperation} from '../../formatters/format-operation';

import {formatCollection} from './format-collection';

export const formatCollectionWithOperation = (
    collection: CollectionInstance,
    operation: unknown,
) => {
    return {
        ...formatCollection(collection),
        operation: operation ? formatOperation(operation as Operation) : undefined,
    };
};
