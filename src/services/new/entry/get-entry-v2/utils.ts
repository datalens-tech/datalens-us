import {AppContext, AppError} from '@gravity-ui/nodekit';
import {TransactionOrKnex} from 'objection';

import {US_ERRORS} from '../../../../const';
import {WorkbookModel} from '../../../../db/models/new/workbook';
import {WorkbookPermission} from '../../../../entities/workbook';
import {getParentIds} from '../../collection/utils';
import {getReplica} from '../../utils';
import {getEntryPermissionsByWorkbook} from '../../workbook/utils';

import {SelectedEntry} from './types';

const GET_PARENTS_QUERY_TIMEOUT = 3000;

export const checkWorkbookEntry = async ({
    ctx,
    trx,
    entry,
    workbook,
    includePermissionsInfo,
}: {
    ctx: AppContext;
    trx?: TransactionOrKnex;
    entry: SelectedEntry;
    workbook: WorkbookModel;
    includePermissionsInfo?: boolean;
}) => {
    let parentIds: string[] = [];

    if (workbook.collectionId !== null) {
        parentIds = await getParentIds({
            ctx,
            trx: getReplica(trx),
            collectionId: workbook.collectionId,
            getParentsQueryTimeout: GET_PARENTS_QUERY_TIMEOUT,
        });
    }

    const registry = ctx.get('registry');

    const {Workbook} = registry.common.classes.get();

    const workbookInstance = new Workbook({
        ctx,
        model: workbook,
    });

    const {accessServiceEnabled} = ctx.config;

    if (accessServiceEnabled) {
        if (includePermissionsInfo) {
            await workbookInstance.fetchAllPermissions({parentIds});

            if (!workbookInstance.permissions?.[WorkbookPermission.LimitedView]) {
                throw new AppError(US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED, {
                    code: US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED,
                });
            }
        } else {
            await workbookInstance.checkPermission({
                parentIds,
                permission: WorkbookPermission.LimitedView,
            });
        }
    } else {
        workbookInstance.enableAllPermissions();
    }

    if (includePermissionsInfo) {
        return getEntryPermissionsByWorkbook({
            workbook: workbookInstance,
            scope: entry.scope,
        });
    }

    return undefined;
};
