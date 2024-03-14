import type {CollectionInstance} from '../../../../registry/common/entities/collection/types';
import {formatCollection} from './format-collection';

export const formatGetCollectionBreadcrumbs = (collections: CollectionInstance[]) => {
    return collections.map(formatCollection);
};
