import type {SharedEntryInstance} from '../../../../../registry/common/entities/shared-entry/types';
import {UsPermissions} from '../../../../../types/models';
import type {EntryPermissions} from '../../types';

type Params = {
    sharedEntry: SharedEntryInstance;
};

export const mapCollectionEntryPermissions = ({
    sharedEntry,
}: Params): EntryPermissions | undefined => {
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

export const getReadOnlyCollectionEntryPermissions = (): EntryPermissions => {
    return {
        [UsPermissions.Execute]: true,
        [UsPermissions.Read]: true,
        [UsPermissions.Edit]: false,
        [UsPermissions.Admin]: false,
    };
};
