import {formatCollectionModel} from './format-collection-model';
import {formatOperation, Operation} from '../../formatters/format-operation';
import {CollectionModel} from '../../../../db/models/new/collection';

export const formatCollectionModelWithOperation = (
    collectionModel: CollectionModel,
    operation: unknown,
) => {
    return {
        ...formatCollectionModel(collectionModel),
        operation: operation ? formatOperation(operation as Operation) : undefined,
    };
};
