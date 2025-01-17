import {CollectionPermission} from '../../../../entities/collection';
import {CollectionInstance} from '../../../../registry/common/entities/collection/types';
import {ServiceArgs} from '../../types';
import {getReplica} from '../../utils';

import {getParentIds} from './get-parents';

export interface CheckAndSetCollectionPermissionArgs {
    collectionInstance: CollectionInstance;
    includePermissionsInfo?: boolean;
    skipCheckPermissions?: boolean;
    permission?: CollectionPermission;
}

export const checkAndSetCollectionPermission = async (
    {ctx, trx}: ServiceArgs,
    args: CheckAndSetCollectionPermissionArgs,
) => {
    const {
        includePermissionsInfo = false,
        skipCheckPermissions = false,
        collectionInstance,
        permission,
    } = args;

    ctx.log('CHECK_COLLECTION_PERMISSION_START');

    const {isPrivateRoute} = ctx.get('info');

    const {accessServiceEnabled} = ctx.config;

    const targetTrx = getReplica(trx);

    if (accessServiceEnabled && !skipCheckPermissions && !isPrivateRoute) {
        let parentIds: string[] = [];
        let localPermission: CollectionPermission;

        if (permission) {
            localPermission = permission;
        } else {
            localPermission = CollectionPermission.LimitedView;
        }

        if (collectionInstance.model.parentId !== null) {
            parentIds = await getParentIds({
                ctx,
                trx: targetTrx,
                collectionId: collectionInstance.model.parentId,
            });
        }

        ctx.log('CHECK_PERMISSION', {permission: localPermission});

        await collectionInstance.checkPermission({
            parentIds,
            permission: localPermission,
        });

        if (includePermissionsInfo) {
            await collectionInstance.fetchAllPermissions({parentIds});
        }
    } else if (includePermissionsInfo) {
        collectionInstance.enableAllPermissions();
    }

    ctx.log('CHECK_COLLECTION_PERMISSION_FINISH');

    return collectionInstance;
};
