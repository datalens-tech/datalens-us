import {CollectionModel} from '../../../../db/models/new/collection';

export const formatGetCollectionBreadcrumbs = (collections: CollectionModel[]) => {
    return collections.map((collection) => ({
        collectionId: collection.collectionId,
        title: collection.title,
    }));
};
