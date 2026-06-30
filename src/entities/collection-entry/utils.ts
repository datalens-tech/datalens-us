import {ComputeEntryPermission} from '../compute-entry';
import {SharedEntryPermission} from '../shared-entry';

import {CollectionEntryPermissions} from './types';

export const mapCollectionEntryPermissionsToSharedEntryPermission: Record<
    CollectionEntryPermissions,
    SharedEntryPermission
> = {
    [CollectionEntryPermissions.Execute]: SharedEntryPermission.LimitedView,
    [CollectionEntryPermissions.Read]: SharedEntryPermission.View,
    [CollectionEntryPermissions.Edit]: SharedEntryPermission.Update,
    [CollectionEntryPermissions.Delete]: SharedEntryPermission.Delete,
    [CollectionEntryPermissions.Move]: SharedEntryPermission.Move,
    [CollectionEntryPermissions.Admin]: SharedEntryPermission.UpdateAccessBindings,
};

export const mapCollectionEntryPermissionsToComputeEntryPermission: Record<
    CollectionEntryPermissions,
    ComputeEntryPermission
> = {
    [CollectionEntryPermissions.Execute]: ComputeEntryPermission.Get,
    [CollectionEntryPermissions.Read]: ComputeEntryPermission.Get,
    [CollectionEntryPermissions.Edit]: ComputeEntryPermission.Update,
    [CollectionEntryPermissions.Delete]: ComputeEntryPermission.Delete,
    [CollectionEntryPermissions.Move]: ComputeEntryPermission.UpdateAccessBindings,
    [CollectionEntryPermissions.Admin]: ComputeEntryPermission.UpdateAccessBindings,
};
