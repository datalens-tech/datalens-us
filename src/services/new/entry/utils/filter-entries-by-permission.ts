import {WorkbookInstance} from '../../../../registry/common/entities/workbook/types';
import {DlsActions, EntryScope} from '../../../../types/models';
import {ServiceArgs} from '../../types';
import {getReplica} from '../../utils';
import {getWorkbooksListByIds} from '../../workbook/get-workbooks-list-by-ids';
import {getEntryPermissionsByWorkbook} from '../../workbook/utils';
import {EntryPermissions} from '../types';

type Permission = 'execute' | 'read' | 'edit' | 'admin';

const DLSPermissionsMap: Record<Permission, DlsActions> = {
    execute: DlsActions.Execute,
    read: DlsActions.Read,
    edit: DlsActions.Edit,
    admin: DlsActions.SetPermissions,
};

type PartialEntry = {
    entryId: string;
    scope: EntryScope;
    workbookId: string | null;
};

type FilterEntriesByPermissionArgs<T> = {
    entries: T[];
    permission?: Permission;
    includePermissionsInfo?: boolean;
};

type EntryWithPermissions<T> = T & {isLocked?: boolean; permissions?: EntryPermissions};

type FilterEntriesByPermissionResult<T> = Promise<EntryWithPermissions<T>[]>;

export const filterEntriesByPermission = async <T extends PartialEntry>(
    {ctx, trx}: ServiceArgs,
    args: FilterEntriesByPermissionArgs<T>,
): FilterEntriesByPermissionResult<T> => {
    const {entries, permission = 'read', includePermissionsInfo} = args;

    const {isPrivateRoute} = ctx.get('info');
    const registry = ctx.get('registry');

    let result: EntryWithPermissions<T>[] = [];

    const workbookEntries: T[] = [];
    const folderEntries: T[] = [];

    entries.forEach((entry) => {
        if (entry.workbookId) {
            workbookEntries.push(entry);
        } else {
            folderEntries.push(entry);
        }
    });

    // TODO: use originatePermissions
    if (folderEntries.length > 0) {
        if (!isPrivateRoute && ctx.config.dlsEnabled) {
            const {DLS} = registry.common.classes.get();

            result = await DLS.checkBulkPermission(
                {ctx, trx: getReplica(trx)},
                {
                    entities: folderEntries,
                    action: DLSPermissionsMap[permission],
                    includePermissionsInfo,
                },
            );
        } else {
            result = folderEntries.map((entry) => ({
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
                {ctx, trx: getReplica(trx)},
                {
                    workbookIds: workbookEntries.map((entry) => entry.workbookId) as string[],
                    includePermissionsInfo: true,
                },
            );

            const workbooksMap = new Map<string, WorkbookInstance>();

            workbookList.forEach((workbook) => {
                workbooksMap.set(workbook.model.workbookId, workbook);
            });

            workbookEntries.forEach((entry) => {
                if (entry?.workbookId && workbooksMap.has(entry.workbookId)) {
                    const workbook = workbooksMap.get(entry.workbookId);

                    if (workbook) {
                        const permissions = getEntryPermissionsByWorkbook({
                            workbook,
                            scope: entry.scope,
                        });

                        if (permissions && permissions[permission]) {
                            result.push({
                                ...entry,
                                isLocked: false,
                                permissions: includePermissionsInfo ? permissions : undefined,
                            });
                        }
                    }
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

    const mapResult = new Map<string, T>();

    result.forEach((entry) => {
        mapResult.set(entry.entryId, entry);
    });

    const orderedResult: T[] = [];

    entries.forEach((entry) => {
        const model = mapResult.get(entry.entryId);

        if (model) {
            orderedResult.push(model);
        }
    });

    return orderedResult;
};
