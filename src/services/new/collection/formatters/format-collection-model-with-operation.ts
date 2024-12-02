import {CollectionModel} from '../../../../db/models/new/collection';
import {Operation, formatOperation} from '../../formatters/format-operation';

import {formatCollectionModel} from './format-collection-model';

export const formatCollectionModelWithOperation = (
    collectionModel: CollectionModel,
    operation: unknown,
) => {
    return {
        ...formatCollectionModel(collectionModel),
        operation: operation ? formatOperation(operation as Operation) : undefined,
    };
};
