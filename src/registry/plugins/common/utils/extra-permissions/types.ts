import type {AppContext} from '@gravity-ui/nodekit';

import type {CollectionInstance} from '../../entities/collection/types';

import {EXTRA_PERMISSIONS_ACTION} from './constants';

export type ExtraPermissionsAction =
    (typeof EXTRA_PERMISSIONS_ACTION)[keyof typeof EXTRA_PERMISSIONS_ACTION];

export type CheckMoveWorkbookExtraPermissionsArgs = {
    ctx: AppContext;
    action: typeof EXTRA_PERMISSIONS_ACTION.MOVE_WORKBOOK;
    workbookId: string;
    parentIds: string[];
    newCollectionParentIds: string[];
};

export type CheckMoveCollectionExtraPermissionsArgs = {
    ctx: AppContext;
    action: typeof EXTRA_PERMISSIONS_ACTION.MOVE_COLLECTION;
    collectionId: string;
    parentIds: string[];
    newParentParentIds: string[];
};

export type CheckCopyWorkbookExtraPermissionsArgs = {
    ctx: AppContext;
    action: typeof EXTRA_PERMISSIONS_ACTION.COPY_WORKBOOK;
    workbookId: string;
    parentIds: string[];
    targetCollection: Optional<CollectionInstance>;
};

export type CheckExtraPermissions = (
    args:
        | CheckMoveWorkbookExtraPermissionsArgs
        | CheckMoveCollectionExtraPermissionsArgs
        | CheckCopyWorkbookExtraPermissionsArgs,
) => Promise<void>;
