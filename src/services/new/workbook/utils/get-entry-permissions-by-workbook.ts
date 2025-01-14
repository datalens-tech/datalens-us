import {EntryScope} from '../../../../db/models/new/entry/types';
import {Permissions} from '../../../../entities/workbook';
import type {WorkbookInstance} from '../../../../registry/common/entities/workbook/types';
import type {EntryScope as EntryScopeType} from '../../../../types/models';

export const getEntryPermissionsByWorkbook = ({
    workbook,
    scope,
}: {
    workbook: WorkbookInstance;
    scope?: EntryScopeType | null;
}) => {
    const permissions = workbook.permissions as Permissions;

    const view = permissions.limitedView;

    const mappedPermission = {
        execute: view,
        read: permissions.view,
        edit: permissions.update,
        admin: permissions.updateAccessBindings,
    };

    if (scope === EntryScope.Dash || scope === EntryScope.Widget || scope === EntryScope.Report) {
        mappedPermission.read = view;
    }

    return mappedPermission;
};
