import {CollectionModel} from '../../../../db/models/new/collection';
import {formatCollectionModel} from './format-collection-model';

export const formatCollectionModelsList = ({
    collections,
    nextPageToken,
}: {
    collections: CollectionModel[];
    nextPageToken?: string;
}) => {
    return {
        collections: collections.map(formatCollectionModel),
        nextPageToken,
    };
};
