import {createCollectionController} from './create-collection';
import {deleteCollectionController} from './delete-collection';
import {deleteCollectionsListController} from './delete-collections-list';
import {getCollectionController} from './get-collection';
import {getCollectionBreadcrumbsController} from './get-collection-breadcrumbs';
import {getCollectionContentController} from './get-collection-content';
import {getCollectionsListByIdsController} from './get-collections-list-by-ids';
import {getRootPermissionsController} from './get-root-permissions';
import {moveCollectionController} from './move-collection';
import {moveCollectionsListController} from './move-collections-list';
import {updateCollectionController} from './update-collection';

export default {
    createCollectionController,
    getCollectionController,
    updateCollectionController,
    getCollectionsListByIdsController,
    getCollectionContentController,
    getRootPermissionsController,
    getCollectionBreadcrumbsController,
    deleteCollectionController,
    deleteCollectionsListController,
    moveCollectionController,
    moveCollectionsListController,
};
