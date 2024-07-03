import type {BulkFetchCollectionsAllPermissions} from './types';
import {Collection} from './collection';

export const bulkFetchCollectionsAllPermissions: BulkFetchCollectionsAllPermissions = async (
    ctx,
    items,
) => {
    return items.map(({model}) => {
        const collection = new Collection({ctx, model});
        // collection.enableAllPermissions();
        collection.fetchAllPermissions({parentIds: []});
        return collection;
    });
};
