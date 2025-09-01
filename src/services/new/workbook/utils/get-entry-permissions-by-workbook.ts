import {EntryScope} from '../../../../db/models/new/entry/types';
import type {WorkbookInstance} from '../../../../registry/common/entities/workbook/types';
import {UsPermissions} from '../../../../types/models';
import type {EntryScope as EntryScopeType} from '../../../../types/models';

type Params = {
    workbook: WorkbookInstance;
    scope?: EntryScopeType | null;
};

type Permissions = {
    [UsPermissions.Execute]: boolean;
    [UsPermissions.Read]: boolean;
    [UsPermissions.Edit]: boolean;
    [UsPermissions.Admin]: boolean;
};

export const getEntryPermissionsByWorkbook = ({
    workbook,
    scope,
}: Params): Permissions | undefined => {
    const permissions = workbook.permissions;

    if (!permissions) {
        return undefined;
    }

    const read =
        scope === EntryScope.Dash || scope === EntryScope.Widget || scope === EntryScope.Report
            ? permissions.limitedView
            : permissions.view;

    return {
        [UsPermissions.Execute]: permissions.limitedView,
        [UsPermissions.Read]: read,
        [UsPermissions.Edit]: permissions.update,
        [UsPermissions.Admin]: permissions.updateAccessBindings,
    };
};
