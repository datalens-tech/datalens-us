import {SharedEntryPermission} from '../../../../../entities/shared-entry';
import {SharedEntryInstance} from '../../../../../registry/common/entities/shared-entry/types';
import {getParentIds} from '../../../collection/utils';
import {ServiceArgs} from '../../../types';
import type {EntryPermissions} from '../../types';

import {checkEntityBindings} from './check-entity-bindings';
import {
    getReadOnlyCollectionEntryPermissions,
    mapCollectionEntryPermissions,
} from './map-collection-entry-permissions';

export interface CheckCollectionEntryPermissionArgs {
    sharedEntryInstance: SharedEntryInstance;
    skipCheckPermissions?: boolean;
    includePermissions?: boolean;

    getEntityBindingsQueryTimeout?: number;
    getParentsQueryTimeout?: number;
    getEntryQueryTimeout?: number;
    getWorkbookQueryTimeout?: number;
}

export async function checkCollectionEntryPermission(
    {ctx, trx}: ServiceArgs,
    args: CheckCollectionEntryPermissionArgs,
) {
    const {
        skipCheckPermissions = false,
        sharedEntryInstance,
        includePermissions,

        getEntityBindingsQueryTimeout,
        getParentsQueryTimeout,
        getEntryQueryTimeout,
        getWorkbookQueryTimeout,
    } = args;

    ctx.log('CHECK_COLLECTION_ENTRY_PERMISSION_START');

    const {
        isPrivateRoute,
        workbookId: requestWorkbookId,
        datasetId: requestDatasetId,
    } = ctx.get('info');
    const {accessServiceEnabled} = ctx.config;

    let permissions: EntryPermissions | undefined;

    if (accessServiceEnabled && !skipCheckPermissions && !isPrivateRoute) {
        if (requestWorkbookId || requestDatasetId) {
            ctx.log('CHECK_COLLECTION_ENTRY_BINDINGS');

            await checkEntityBindings(
                {ctx, trx},
                {
                    sharedEntryInstance,
                    getEntityBindingsQueryTimeout,
                    getParentsQueryTimeout,
                    getEntryQueryTimeout,
                    getWorkbookQueryTimeout,
                },
            );

            if (includePermissions) {
                permissions = getReadOnlyCollectionEntryPermissions();
            }
        } else {
            const parentIds = await getParentIds({
                ctx,
                trx,
                collectionId: sharedEntryInstance.model.collectionId as string,
                getParentsQueryTimeout,
            });
            await sharedEntryInstance.checkPermission({
                parentIds,
                permission: SharedEntryPermission.LimitedView,
            });

            if (includePermissions) {
                await sharedEntryInstance.fetchAllPermissions({parentIds});
                permissions = mapCollectionEntryPermissions({sharedEntry: sharedEntryInstance});
            }
        }
    } else {
        sharedEntryInstance.enableAllPermissions();

        if (includePermissions) {
            permissions = mapCollectionEntryPermissions({sharedEntry: sharedEntryInstance});
        }
    }

    ctx.log('CHECK_COLLECTION_ENTRY_PERMISSION_FINISH');

    return permissions;
}
