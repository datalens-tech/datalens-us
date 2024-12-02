import type {CollectionInstance} from '../../../../registry/common/entities/collection/types';

import {formatCollection} from './format-collection';

export const formatCollectionsList = ({
    collections,
    nextPageToken,
}: {
    collections: CollectionInstance[];
    nextPageToken?: string;
}) => {
    return {
        collections: collections.map(formatCollection),
        nextPageToken,
    };
};
