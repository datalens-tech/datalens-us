import {AppContext, AppError} from '@gravity-ui/nodekit';

import {Permissions as SharedEntryPermissions} from '../../../../entities/shared-entry';
import {UsPermissions} from '../../../../types/models';
import type {EntryPermissions} from '../types';

export const mapReadOnlySharedEntryPermissions = ({
    ctx,
    permissions,
}: {
    ctx: AppContext;
    permissions?: SharedEntryPermissions;
}): EntryPermissions => {
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

export const getReadOnlySharedEntryPermissions = (): EntryPermissions => {
    return {
        [UsPermissions.Execute]: true,
        [UsPermissions.Read]: true,
        [UsPermissions.Edit]: false,
        [UsPermissions.Admin]: false,
    };
};

export const getMinimumReadOnlySharedEntryPermissions = (
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
