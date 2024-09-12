import {AppContext} from '@gravity-ui/nodekit';
import {Permissions} from '../../../../entities/workbook';
import type {WorkbookInstance} from '../../../../registry/common/entities/workbook/types';
import {Feature, isEnabledFeature} from '../../../../components/features';
import type {EntryScope as EntryScopeType} from '../../../../types/models';
import {EntryScope} from '../../../../db/models/new/entry/types';

export const getEntryPermissionsByWorkbook = ({
    ctx,
    workbook,
    scope,
}: {
    ctx: AppContext;
    workbook: WorkbookInstance;
    scope?: EntryScopeType | null;
}) => {
    const permissions = workbook.permissions as Permissions;

    const view = isEnabledFeature(ctx, Feature.UseLimitedView)
        ? permissions.limitedView
        : permissions.view;

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
