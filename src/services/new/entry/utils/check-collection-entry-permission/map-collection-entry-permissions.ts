import {AppContext, AppError} from '@gravity-ui/nodekit';

import type {SharedEntryInstance} from '../../../../../registry/common/entities/shared-entry/types';
import {UsPermissions} from '../../../../../types/models';
import type {EntryPermissions} from '../../types';

type MapCollectionEntryPermissionsParams = {
    sharedEntry: SharedEntryInstance;
};

export const mapCollectionEntryPermissions = ({
    sharedEntry,
}: MapCollectionEntryPermissionsParams): EntryPermissions | undefined => {
    const permissions = sharedEntry.permissions;

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

type MapReadOnlyCollectionEntryPermissionsParams = {
    ctx: AppContext;
    sharedEntry: SharedEntryInstance;
};

export const mapReadOnlyCollectionEntryPermissions = ({
    ctx,
    sharedEntry,
}: MapReadOnlyCollectionEntryPermissionsParams): EntryPermissions => {
    const permissions = sharedEntry.permissions;

    if (!permissions) {
        ctx.logError('Permissions are not set');
        throw new AppError('Permissions are not set');
    }

    return {
        [UsPermissions.Execute]: permissions.limitedView,
        [UsPermissions.Read]: permissions.view,
        [UsPermissions.Edit]: false,
        [UsPermissions.Admin]: false,
    };
};

export const getReadOnlyCollectionEntryPermissions = (): EntryPermissions => {
    return {
        [UsPermissions.Execute]: true,
        [UsPermissions.Read]: true,
        [UsPermissions.Edit]: false,
        [UsPermissions.Admin]: false,
    };
};

export const getMinimumReadOnlyCollectionEntryPermissions = (
    permissions: EntryPermissions[],
): EntryPermissions => {
    return {
        [UsPermissions.Execute]: permissions.every(
            (permission) => permission[UsPermissions.Execute],
        ),
        [UsPermissions.Read]: permissions.every((permission) => permission[UsPermissions.Read]),
        [UsPermissions.Edit]: false,
        [UsPermissions.Admin]: false,
    };
};
