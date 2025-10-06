import {AppError} from '@gravity-ui/nodekit';

import {US_ERRORS} from '../../../../../const/errors';
import {Entry} from '../../../../../db/models/new/entry';
import {SharedEntryPermission} from '../../../../../entities/shared-entry';
import Utils from '../../../../../utils';
import {getParentIds} from '../../../collection/utils';
import {ServiceArgs} from '../../../types';
import {PartialEntry} from '../../types';

import {mapCollectionEntryPermissions} from './map-collection-entry-permissions';

export async function checkSharedEntryPermission(
    {ctx, trx}: ServiceArgs,
    {
        entry,
        permission = SharedEntryPermission.LimitedView,
        includePermissionsInfo = false,
    }: {entry: PartialEntry; permission?: SharedEntryPermission; includePermissionsInfo?: boolean},
) {
    const {accessServiceEnabled} = ctx.config;
    const {isPrivateRoute} = ctx.get('info');
    const registry = ctx.get('registry');
    const {SharedEntry} = registry.common.classes.get();

    ctx.log('CHECK_SHARED_ENTRY_PERMISSION_START', {
        entryId: Utils.encodeId(entry.entryId),
        permission,
    });

    if (!entry.collectionId) {
        throw new AppError(US_ERRORS.SHARED_ENTRY_REQUIRE_COLLECTION_ID, {
            code: US_ERRORS.SHARED_ENTRY_REQUIRE_COLLECTION_ID,
        });
    }
    const sharedEntry = new SharedEntry({
        ctx,
        model: entry as unknown as Entry,
    });

    if (accessServiceEnabled && !isPrivateRoute) {
        const parentIds = await getParentIds({
            ctx,
            trx,
            collectionId: entry.collectionId,
        });

        if (includePermissionsInfo) {
            await sharedEntry.fetchAllPermissions({parentIds});

            if (!sharedEntry.permissions?.[permission]) {
                throw new AppError(US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED, {
                    code: US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED,
                });
            }
        } else {
            await sharedEntry.checkPermission({
                parentIds,
                permission,
            });
        }
    } else if (includePermissionsInfo) {
        sharedEntry.enableAllPermissions();
    }

    ctx.log('CHECK_SHARED_ENTRY_PERMISSION_FINISH', {
        entryId: Utils.encodeId(entry.entryId),
    });

    return {
        sharedEntry,
        permissions: mapCollectionEntryPermissions({sharedEntry}),
    };
}
