import {createCollectionController} from './create';
import {deleteCollectionController} from './delete';
import {deleteListController} from './deleteList';
import {getCollectionController} from './get';
import {getCollectionBreadcrumbsController} from './getBreadcrumbs';
import {getCollectionsListByIdsController} from './getCollectionsListByIds';
import {getCollectionContentController} from './getContent';
import {getRootCollectionPermissionsController} from './getRootPermissions';
import {moveCollectionController} from './move';
import {moveCollectionsListController} from './moveList';
import {updateCollectionController} from './update';

export default {
    create: createCollectionController,

    get: getCollectionController,

    getCollectionsListByIds: getCollectionsListByIdsController,

    /**
     * @deprecated for structureItemsController.getStructureItems,
     * @todo remove, after successful deploy with UI.
     * Exists for reverse compatibility.
     */
    getContent: getCollectionContentController,

    getRootPermissions: getRootCollectionPermissionsController,

    getBreadcrumbs: getCollectionBreadcrumbsController,

    delete: deleteCollectionController,

    deleteList: deleteListController,

    move: moveCollectionController,

    moveList: moveCollectionsListController,

    update: updateCollectionController,
};
