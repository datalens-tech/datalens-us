import {
    AccessServicePermissionDeniedError,
    CollectionEntryRequireCollectionIdError,
} from '../../../../components/errors';
import {Entry as EntryModel} from '../../../../db/models/new/entry';
import {CollectionEntryPermissions} from '../../../../entities/collection-entry';
import Utils from '../../../../utils';
import {getParentIds} from '../../collection/utils';
import {ServiceArgs} from '../../types';
import type {EntryPermissions, PartialEntry} from '../types';

import {createCollectionEntry, getCollectionEntryPermissions} from './utils';

export async function checkCollectionEntryPermission(
    {ctx, trx}: ServiceArgs,
    {
        entry,
        permission = CollectionEntryPermissions.Execute,
        includePermissionsInfo = false,
    }: {
        entry: PartialEntry;
        permission?: CollectionEntryPermissions;
        includePermissionsInfo?: boolean;
    },
): Promise<{permissions?: EntryPermissions}> {
    const {accessServiceEnabled} = ctx.config;
    const {isPrivateRoute} = ctx.get('info');

    ctx.log('CHECK_COLLECTION_ENTRY_PERMISSION_START', {
        entryId: Utils.encodeId(entry.entryId),
        permission,
    });

    if (!entry.collectionId) {
        throw new CollectionEntryRequireCollectionIdError();
    }

    const instance = createCollectionEntry(ctx, entry as EntryModel);

    if (accessServiceEnabled && !isPrivateRoute) {
        const parentIds = await getParentIds({ctx, trx, collectionId: entry.collectionId});

        if (includePermissionsInfo) {
            await instance.fetchAllPermissions({parentIds});

            if (!instance.hasPermission(permission)) {
                throw new AccessServicePermissionDeniedError();
            }
        } else {
            await instance.checkPermission({parentIds, permission});
        }
    } else if (includePermissionsInfo) {
        instance.enableAllPermissions();
    }

    ctx.log('CHECK_COLLECTION_ENTRY_PERMISSION_FINISH', {entryId: Utils.encodeId(entry.entryId)});

    return {permissions: getCollectionEntryPermissions(instance)};
}
