import {AppContext} from '@gravity-ui/nodekit';
import {DlsActions, EntryWithPermissionOnly} from '../../../../types/models';
import {registry} from '../../../../registry';
import {getWorkbooksListByIds} from '../../workbook/get-workbooks-list-by-ids';
import {EntryPermissions} from '../types';
import {WorkbookInstance} from '../../../../registry/common/entities/workbook/types';
import {getEntryPermissionsByWorkbook} from '../../workbook/utils';

type Permission = 'execute' | 'read' | 'edit' | 'admin';

const DLSPermissionsMap: Record<Permission, DlsActions> = {
    execute: DlsActions.Execute,
    read: DlsActions.Read,
    edit: DlsActions.Edit,
    admin: DlsActions.SetPermissions,
};

export type FilterEntriesByPermissionArgs = {
    entries: EntryWithPermissionOnly[];
    includePermissionsInfo?: boolean;
    permission?: Permission;
    isPrivateRoute?: boolean;
};

export const filterEntriesByPermission = async (
    ctx: AppContext,
    {
        entries,
        includePermissionsInfo,
        permission = 'read',
        isPrivateRoute,
    }: FilterEntriesByPermissionArgs,
) => {
    const workbookEntries: EntryWithPermissionOnly[] = [];
    const entryWithoutWorkbook: EntryWithPermissionOnly[] = [];
    let result: EntryWithPermissionOnly[] = [];

    const {DLS} = registry.common.classes.get();

    entries.forEach((entry) => {
        if (entry.workbookId) {
            workbookEntries.push(entry);
        } else {
            entryWithoutWorkbook.push(entry);
        }
    });

    // TODO: use originatePermissions
    if (entryWithoutWorkbook.length > 0) {
        if (!isPrivateRoute && ctx.config.dlsEnabled) {
            result = await DLS.checkBulkPermission(
                {ctx},
                {
                    entities: entryWithoutWorkbook,
                    action: DLSPermissionsMap[permission],
                    includePermissionsInfo,
                },
            );
        } else {
            result = entryWithoutWorkbook.map((entry) => ({
                ...entry,
                isLocked: false,
                ...(includePermissionsInfo && {
                    permissions: {
                        execute: true,
                        read: true,
                        edit: true,
                        admin: true,
                    },
                }),
            }));
        }
    }

    if (workbookEntries.length > 0) {
        if (!isPrivateRoute && ctx.config.accessServiceEnabled) {
            const workbookList = await getWorkbooksListByIds(
                {ctx},
                {
                    workbookIds: workbookEntries.map((entry) => entry.workbookId) as string[],
                    includePermissionsInfo,
                },
            );

            const entryPermissionsMap = new Map<string, EntryPermissions>();
            const workbooksMap = new Map<string, WorkbookInstance>();

            workbookList.forEach((workbook) => {
                workbooksMap.set(workbook.model.workbookId, workbook);
            });

            workbookEntries.forEach((entry) => {
                if (entry?.workbookId && workbooksMap.has(entry.workbookId)) {
                    const workbook = workbooksMap.get(entry.workbookId);

                    if (workbook && includePermissionsInfo) {
                        const permissions = getEntryPermissionsByWorkbook({
                            ctx,
                            workbook,
                            scope: entry.scope,
                        });
                        entryPermissionsMap.set(entry.entryId, permissions);
                    }

                    let isLocked = false;

                    if (entryPermissionsMap.has(entry.entryId)) {
                        const permissions = entryPermissionsMap.get(entry.entryId);

                        if (permissions && !permissions[permission]) {
                            isLocked = true;
                        }
                    }

                    result.push({
                        ...entry,
                        permissions: includePermissionsInfo
                            ? entryPermissionsMap.get(entry.entryId)
                            : undefined,
                        isLocked,
                    });
                }
            });
        } else {
            result = [
                ...result,
                ...workbookEntries.map((entry) => ({
                    ...entry,
                    isLocked: false,
                    ...(includePermissionsInfo && {
                        permissions: {
                            execute: true,
                            read: true,
                            edit: true,
                            admin: true,
                        },
                    }),
                })),
            ];
        }
    }

    const mapResult = new Map<string, EntryWithPermissionOnly>();

    result.forEach((entry) => {
        mapResult.set(entry.entryId, entry);
    });

    return mapResult;
};
