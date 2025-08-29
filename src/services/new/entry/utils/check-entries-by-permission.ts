import {WorkbookInstance} from '../../../../registry/common/entities/workbook/types';
import {DlsActions, UsPermissions} from '../../../../types/models';
import {ServiceArgs} from '../../types';
import {getReplica} from '../../utils';
import {getWorkbooksListByIds} from '../../workbook/get-workbooks-list-by-ids';
import {getEntryPermissionsByWorkbook} from '../../workbook/utils';
import {EntryWithPermissions, PartialEntry} from '../types';

const DLSPermissionsMap: Record<UsPermissions, DlsActions> = {
    [UsPermissions.Execute]: DlsActions.Execute,
    [UsPermissions.Read]: DlsActions.Read,
    [UsPermissions.Edit]: DlsActions.Edit,
    [UsPermissions.Admin]: DlsActions.SetPermissions,
};

export type CheckEntriesByPermissionArgs<T> = {
    entries: T[];
    permission?: UsPermissions;
    includePermissionsInfo?: boolean;
};

const checkFolderEntriesByPermission = async <T extends PartialEntry>(
    {ctx, trx}: ServiceArgs,
    args: CheckEntriesByPermissionArgs<T>,
): Promise<EntryWithPermissions<T>[]> => {
    const {entries, permission = UsPermissions.Read, includePermissionsInfo} = args;

    if (entries.length === 0) {
        return [];
    }

    const {isPrivateRoute} = ctx.get('info');
    const registry = ctx.get('registry');

    // TODO: use originatePermissions
    if (!isPrivateRoute && ctx.config.dlsEnabled) {
        const {DLS} = registry.common.classes.get();

        return DLS.checkBulkPermission(
            {ctx, trx: getReplica(trx)},
            {
                entities: entries,
                action: DLSPermissionsMap[permission],
                includePermissionsInfo,
            },
        );
    }

    return entries.map((entry) => ({
        ...entry,
        isLocked: false,
        ...(includePermissionsInfo && {
            permissions: {
                [UsPermissions.Execute]: true,
                [UsPermissions.Read]: true,
                [UsPermissions.Edit]: true,
                [UsPermissions.Admin]: true,
            },
        }),
    }));
};

const checkWorkbookEntriesByPermission = async <T extends PartialEntry>(
    {ctx, trx}: ServiceArgs,
    args: CheckEntriesByPermissionArgs<T>,
): Promise<EntryWithPermissions<T>[]> => {
    const {entries, permission = UsPermissions.Read, includePermissionsInfo} = args;

    if (entries.length === 0) {
        return [];
    }

    const {isPrivateRoute} = ctx.get('info');

    if (isPrivateRoute || !ctx.config.accessServiceEnabled) {
        return entries.map((entry) => ({
            ...entry,
            isLocked: false,
            ...(includePermissionsInfo && {
                permissions: {
                    [UsPermissions.Execute]: true,
                    [UsPermissions.Read]: true,
                    [UsPermissions.Edit]: true,
                    [UsPermissions.Admin]: true,
                },
            }),
        }));
    }

    const workbookIds: string[] = [
        ...new Set(
            entries.map((entry) => entry.workbookId).filter((workbookId) => workbookId !== null),
        ),
    ];

    const workbookList = await getWorkbooksListByIds(
        {ctx, trx: getReplica(trx)},
        {
            workbookIds,
            includePermissionsInfo: true,
        },
    );

    const workbooksMap = new Map<string, WorkbookInstance>(
        workbookList.map((workbook) => [workbook.model.workbookId, workbook]),
    );

    return entries.map((entry) => {
        if (entry.workbookId && workbooksMap.has(entry.workbookId)) {
            const workbook = workbooksMap.get(entry.workbookId);

            if (workbook) {
                const permissions = getEntryPermissionsByWorkbook({
                    workbook,
                    scope: entry.scope,
                });

                return {
                    ...entry,
                    isLocked: !(permissions && permissions[permission]),
                    permissions: includePermissionsInfo ? permissions : undefined,
                };
            }
        }
        return {
            ...entry,
            isLocked: true,
            permissions: includePermissionsInfo
                ? {
                      [UsPermissions.Execute]: false,
                      [UsPermissions.Read]: false,
                      [UsPermissions.Edit]: false,
                      [UsPermissions.Admin]: false,
                  }
                : undefined,
        };
    });
};

export const checkEntriesByPermission = async <T extends PartialEntry>(
    {ctx, trx}: ServiceArgs,
    args: CheckEntriesByPermissionArgs<T>,
): Promise<EntryWithPermissions<T>[]> => {
    const {entries, permission, includePermissionsInfo} = args;

    const workbookEntries: T[] = [];
    const folderEntries: T[] = [];

    entries.forEach((entry) => {
        if (entry.workbookId) {
            workbookEntries.push(entry);
        } else {
            folderEntries.push(entry);
        }
    });

    const [folderEntriesResult, workbookEntriesResult] = await Promise.all([
        checkFolderEntriesByPermission(
            {ctx, trx},
            {entries: folderEntries, permission, includePermissionsInfo},
        ),
        checkWorkbookEntriesByPermission(
            {ctx, trx},
            {entries: workbookEntries, permission, includePermissionsInfo},
        ),
    ]);

    const result: EntryWithPermissions<T>[] = [...folderEntriesResult, ...workbookEntriesResult];

    const mapResult = new Map<string, T>(result.map((entry) => [entry.entryId, entry]));
    const orderedResult: T[] = [];

    entries.forEach((entry) => {
        const model = mapResult.get(entry.entryId);

        if (model) {
            orderedResult.push(model);
        }
    });

    return orderedResult;
};
