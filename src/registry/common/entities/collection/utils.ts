import {Collection} from './collection';
import type {BulkFetchCollectionsAllPermissions} from './types';

export const bulkFetchCollectionsAllPermissions: BulkFetchCollectionsAllPermissions = async (
    ctx,
    items,
) => {
    return items.map(({model}) => {
        const collection = new Collection({ctx, model});
        if (ctx.config.accessServiceEnabled) {
            collection.fetchAllPermissions({parentIds: []});
        } else {
            collection.enableAllPermissions();
        }
        return collection;
    });
};
