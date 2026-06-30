import {AccessServicePermissionDeniedError} from '../../../../components/errors';
import {Entry as EntryModel} from '../../../../db/models/new/entry';
import {EntryScope} from '../../../../db/models/new/entry/types';
import {CollectionEntryPermissions} from '../../../../entities/collection-entry';
import {ALLOWED_SHARED_ENTRY_SCOPES} from '../../../../entities/shared-entry';
import {UsPermissions} from '../../../../types/models';
import {getParentIds} from '../../collection/utils';
import {ServiceArgs} from '../../types';
import {checkEntityBindings} from '../shared-entry';
import type {EntryFullPermissions, EntryPermissions} from '../types';

import {createCollectionEntry, getCollectionEntryPermissions} from './utils';

export interface ResolveCollectionEntryPermissionsArgs {
    entry: EntryModel;
    permission: CollectionEntryPermissions;
    skipCheckPermissions?: boolean;
    includePermissions?: boolean;
    getEntityBindingsQueryTimeout?: number;
    getParentsQueryTimeout?: number;
    getEntryQueryTimeout?: number;
    getWorkbookQueryTimeout?: number;
}

export async function resolveCollectionEntryPermissions(
    {ctx, trx}: ServiceArgs,
    args: ResolveCollectionEntryPermissionsArgs,
): Promise<{permissions?: EntryPermissions; fullPermissions?: EntryFullPermissions}> {
    const {
        skipCheckPermissions = false,
        entry,
        permission,
        includePermissions,
        getEntityBindingsQueryTimeout,
        getParentsQueryTimeout,
        getEntryQueryTimeout,
        getWorkbookQueryTimeout,
    } = args;

    ctx.log('RESOLVE_COLLECTION_ENTRY_PERMISSIONS_START');

    const {
        isPrivateRoute,
        workbookId: requestWorkbookId,
        datasetId: requestDatasetId,
    } = ctx.get('info');
    const {accessServiceEnabled} = ctx.config;

    let permissions: EntryPermissions | undefined;
    let fullPermissions: EntryFullPermissions | undefined;

    const checkEnabled = accessServiceEnabled && !skipCheckPermissions && !isPrivateRoute;

    if (
        checkEnabled &&
        (requestWorkbookId || requestDatasetId) &&
        ALLOWED_SHARED_ENTRY_SCOPES.includes(entry.scope as EntryScope)
    ) {
        ctx.log('CHECK_SHARED_ENTRY_BINDINGS');

        const {SharedEntry} = ctx.get('registry').common.classes.get();
        const sharedEntryInstance = new SharedEntry({ctx, model: entry});

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

        if (!entryPermissions.permissions?.[permission as unknown as UsPermissions]) {
            throw new AccessServicePermissionDeniedError();
        }

        if (includePermissions) {
            permissions = entryPermissions.permissions;
            fullPermissions = entryPermissions.fullPermissions;
        }

        ctx.log('RESOLVE_COLLECTION_ENTRY_PERMISSIONS_FINISH');
        return {permissions, fullPermissions};
    }

    const instance = createCollectionEntry(ctx, entry);

    if (checkEnabled) {
        const parentIds = await getParentIds({
            ctx,
            trx,
            collectionId: entry.collectionId as string,
            getParentsQueryTimeout,
        });

        if (includePermissions) {
            await instance.fetchAllPermissions({parentIds});

            if (!instance.hasPermission(permission)) {
                throw new AccessServicePermissionDeniedError();
            }

            permissions = getCollectionEntryPermissions(instance);
            fullPermissions = instance.permissions;
        } else {
            await instance.checkPermission({parentIds, permission});
        }
    } else {
        instance.enableAllPermissions();

        if (includePermissions) {
            permissions = getCollectionEntryPermissions(instance);
            fullPermissions = instance.permissions;
        }
    }

    ctx.log('RESOLVE_COLLECTION_ENTRY_PERMISSIONS_FINISH');
    return {permissions, fullPermissions};
}
