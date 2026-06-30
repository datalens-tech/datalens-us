import {ComputeEntryPermission, ComputeEntryPermissions} from '../../../../entities/compute-entry';
import {Permissions as SharedEntryPermissions} from '../../../../entities/shared-entry';
import {UsPermissions} from '../../../../types/models';
import type {EntryPermissions} from '../types';

export const mapComputeEntryPermissions = (
    permissions?: ComputeEntryPermissions,
): EntryPermissions | undefined => {
    if (!permissions) {
        return undefined;
    }

    return {
        [UsPermissions.Execute]: permissions[ComputeEntryPermission.Get],
        [UsPermissions.Read]: permissions[ComputeEntryPermission.Get],
        [UsPermissions.Edit]: permissions[ComputeEntryPermission.Update],
        [UsPermissions.Admin]: permissions[ComputeEntryPermission.UpdateAccessBindings],
    };
};

export const mapSharedEntryPermissions = (
    permissions?: SharedEntryPermissions,
): EntryPermissions | undefined => {
    if (!permissions) {
        return undefined;
    }

    return {
        [UsPermissions.Execute]: permissions.limitedView,
        [UsPermissions.Read]: permissions.view,
        [UsPermissions.Edit]: permissions.update,
        [UsPermissions.Admin]: permissions.updateAccessBindings,
    };
};
