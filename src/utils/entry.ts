import {AppContext} from '@gravity-ui/nodekit';
import {DlsActions, EntryWithPermissionOnly} from '../types/models';
import {registry} from '../registry';
import {getWorkbooksListByIds} from '../services/new/workbook/get-workbooks-list-by-ids';
import {EntryPermissions} from '../services/new/entry/types';
import {WorkbookInstance} from '../registry/common/entities/workbook/types';
import {getEntryPermissionsByWorkbook} from '../services/new/workbook/utils';

export type GetEntriesWithPermissionsOnlyArgs = {
    entries: EntryWithPermissionOnly[];
    includePermissionsInfo?: boolean;
    isPrivateRoute?: boolean;
};

export const getEntriesWithPermissionsOnly = async (
    ctx: AppContext,
    {entries, includePermissionsInfo, isPrivateRoute}: GetEntriesWithPermissionsOnlyArgs,
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
                    action: DlsActions.Read,
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
                        const isReadPermission = entryPermissionsMap.get(entry.entryId)?.read;

                        if (!isReadPermission) {
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
