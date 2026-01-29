import {AppError} from '@gravity-ui/nodekit';

import {US_ERRORS} from '../../../../../const/errors';
import {Permissions as SharedEntryPermissions} from '../../../../../entities/shared-entry';
import {SharedEntryInstance} from '../../../../../registry/plugins/common/entities/shared-entry/types';
import {UsPermissions} from '../../../../../types/models';
import {getParentIds} from '../../../collection/utils';
import {ServiceArgs} from '../../../types';
import type {EntryPermissions} from '../../types';

import {checkEntityBindings} from './check-entity-bindings';
import {
    mapCollectionEntryPermissions,
    mapPermissionToSharedEntryPermission,
} from './map-collection-entry-permissions';

export interface CheckCollectionEntryPermissionArgs {
    sharedEntryInstance: SharedEntryInstance;
    permission: UsPermissions;
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
        permission,
        includePermissions,
        getEntityBindingsQueryTimeout,
        getParentsQueryTimeout,
        getEntryQueryTimeout,
        getWorkbookQueryTimeout,
    } = args;

    const sharedEntryPermission = mapPermissionToSharedEntryPermission[permission];

    ctx.log('CHECK_COLLECTION_ENTRY_PERMISSION_START');

    const {
        isPrivateRoute,
        workbookId: requestWorkbookId,
        datasetId: requestDatasetId,
    } = ctx.get('info');
    const {accessServiceEnabled} = ctx.config;

    let permissions: EntryPermissions | undefined;
    let fullPermissions: SharedEntryPermissions | undefined;

    if (accessServiceEnabled && !skipCheckPermissions && !isPrivateRoute) {
        if (requestWorkbookId || requestDatasetId) {
            ctx.log('CHECK_COLLECTION_ENTRY_BINDINGS');

            const entryPermissions = await checkEntityBindings(
                {ctx, trx},
                {
                    sharedEntryInstance,
                    includePermissions,
                    getEntityBindingsQueryTimeout,
                    getParentsQueryTimeout,
                    getEntryQueryTimeout,
                    getWorkbookQueryTimeout,
                },
            );

            if (!entryPermissions.permissions?.[permission]) {
                throw new AppError(US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED, {
                    code: US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED,
                });
            }

            if (includePermissions) {
                permissions = entryPermissions.permissions;
                fullPermissions = entryPermissions.fullPermissions;
            }
        } else {
            const parentIds = await getParentIds({
                ctx,
                trx,
                collectionId: sharedEntryInstance.model.collectionId as string,
                getParentsQueryTimeout,
            });

            if (includePermissions) {
                await sharedEntryInstance.fetchAllPermissions({parentIds});

                if (!sharedEntryInstance.permissions?.[sharedEntryPermission]) {
                    throw new AppError(US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED, {
                        code: US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED,
                    });
                }
                permissions = mapCollectionEntryPermissions({sharedEntry: sharedEntryInstance});
                fullPermissions = sharedEntryInstance.permissions;
            } else {
                await sharedEntryInstance.checkPermission({
                    parentIds,
                    permission: sharedEntryPermission,
                });
            }
        }
    } else {
        sharedEntryInstance.enableAllPermissions();

        if (includePermissions) {
            permissions = mapCollectionEntryPermissions({sharedEntry: sharedEntryInstance});
            fullPermissions = sharedEntryInstance.permissions;
        }
    }

    ctx.log('CHECK_COLLECTION_ENTRY_PERMISSION_FINISH');

    return {permissions, fullPermissions};
}
