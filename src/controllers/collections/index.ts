import {createCollection} from './create-collection';
import {deleteCollection} from './delete-collection';
import {deleteCollectionsList} from './delete-collections-list';
import {getCollection} from './get-collection';
import {getCollectionBreadcrumbs} from './get-collection-breadcrumbs';
import {getCollectionContent} from './get-collection-content';
import {getCollectionsListByIds} from './get-collections-list-by-ids';
import {getRootPermissions} from './get-root-permissions';
import {moveCollection} from './move-collection';
import {moveCollectionsList} from './move-collections-list';
import {updateCollection} from './update-collection';

export default {
    createCollection,
    getCollection,
    updateCollection,
    getCollectionsListByIds,
    getCollectionContent,
    getRootPermissions,
    getCollectionBreadcrumbs,
    deleteCollection,
    deleteCollectionsList,
    moveCollection,
    moveCollectionsList,
};
