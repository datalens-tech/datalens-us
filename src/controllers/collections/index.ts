import {create} from './create';
import {deleteCollection} from './delete-collection';
import {deleteCollectionsList} from './delete-collections-list';
import {get} from './get';
import {getBreadcrumbs} from './get-breadcrumbs';
import {getContent} from './get-content';
import {getListByIds} from './get-list-by-ids';
import {getRootPermissions} from './get-root-permissions';
import {move} from './move';
import {moveList} from './move-list';
import {update} from './update';

export default {
    create,
    get,
    update,
    getListByIds,
    getContent,
    getRootPermissions,
    getBreadcrumbs,
    deleteCollection,
    deleteCollectionsList,
    move,
    moveList,
};
