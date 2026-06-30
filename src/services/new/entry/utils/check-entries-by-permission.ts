import {AccessServicePermissionDeniedError} from '../../../../components/errors';
import {Entry as EntryModel} from '../../../../db/models/new/entry';
import {EntryScope} from '../../../../db/models/new/entry/types';
import {WorkbookInstance} from '../../../../registry/plugins/common/entities/workbook/types';
import {DlsActions, UsPermissions} from '../../../../types/models';
import {makeCollectionEntriesWithParentsMap} from '../../collection/utils/get-parents';
import {ServiceArgs} from '../../types';
import {getReplica} from '../../utils';
import {getWorkbooksListByIds} from '../../workbook/get-workbooks-list-by-ids';
import {getEntryPermissionsByWorkbook} from '../../workbook/utils';
import {
    bulkFetchCollectionEntryPermissions,
    createCollectionEntry,
    getCollectionEntryDisabledPermissions,
    getCollectionEntryPermissions,
} from '../collection-entry';
import {EntryFullPermissions, EntryWithPermissions, PartialEntry} from '../types';

const DLSPermissionsMap: Record<UsPermissions, DlsActions> = {
    [UsPermissions.Execute]: DlsActions.Execute,
    [UsPermissions.Read]: DlsActions.Read,
    [UsPermissions.Edit]: DlsActions.Edit,
    [UsPermissions.Admin]: DlsActions.SetPermissions,
};

const makeEntryWithFullPermissions = <T extends PartialEntry>(
    entry: T,
    includePermissionsInfo?: boolean,
): EntryWithPermissions<T> => ({
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
});

const makeEntryWithNoPermissions = <T extends PartialEntry>(
    entry: T,
    includePermissionsInfo?: boolean,
): EntryWithPermissions<T> => ({
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
});

export type CheckEntriesByPermissionArgs<T> = {
    entries: T[];
    permission?: UsPermissions;
    includePermissionsInfo?: boolean;
};

export const checkFolderEntriesByPermission = async <T extends PartialEntry>(
    {ctx, trx}: ServiceArgs,
    args: CheckEntriesByPermissionArgs<T>,
): Promise<EntryWithPermissions<T, EntryFullPermissions>[]> => {
    const {entries, permission = UsPermissions.Read, includePermissionsInfo} = args;

    if (entries.length === 0) {
        return [];
    }

    const {isPrivateRoute, isAuditRoute} = ctx.get('info');
    const registry = ctx.get('registry');

    // TODO: use originatePermissions
    if (!isPrivateRoute && !isAuditRoute && ctx.config.dlsEnabled) {
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

    return entries.map((entry) => makeEntryWithFullPermissions(entry, includePermissionsInfo));
};

export const checkWorkbookEntriesByPermission = async <T extends PartialEntry>(
    {ctx, trx}: ServiceArgs,
    args: CheckEntriesByPermissionArgs<T>,
): Promise<EntryWithPermissions<T, EntryFullPermissions>[]> => {
    const {entries, permission = UsPermissions.Read, includePermissionsInfo} = args;

    if (entries.length === 0) {
        return [];
    }

    const {isPrivateRoute, isAuditRoute} = ctx.get('info');

    if (isPrivateRoute || isAuditRoute || !ctx.config.accessServiceEnabled) {
        return entries.map((entry) => makeEntryWithFullPermissions(entry, includePermissionsInfo));
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
        return makeEntryWithNoPermissions(entry, includePermissionsInfo);
    });
};

export const checkCollectionEntriesByPermission = async <T extends PartialEntry>(
    {ctx, trx}: ServiceArgs,
    args: CheckEntriesByPermissionArgs<T>,
): Promise<EntryWithPermissions<T, EntryFullPermissions>[]> => {
    const {entries, permission = UsPermissions.Read, includePermissionsInfo} = args;

    if (entries.length === 0) {
        return [];
    }

    const {isPrivateRoute, isAuditRoute} = ctx.get('info');

    if (isPrivateRoute || isAuditRoute || !ctx.config.accessServiceEnabled) {
        return entries.map((entry) => {
            const instance = createCollectionEntry(ctx, entry as unknown as EntryModel);
            instance.enableAllPermissions();
            return {
                ...makeEntryWithFullPermissions(entry, includePermissionsInfo),
                fullPermissions: includePermissionsInfo ? instance.permissions : undefined,
            };
        });
    }

    const entriesWithParentsMap = await makeCollectionEntriesWithParentsMap(
        {ctx, trx},
        {
            models: entries as unknown[] as EntryModel[],
        },
    );

    const items: {model: EntryModel; parentIds: string[]}[] = [];
    entriesWithParentsMap.forEach((parentIds, model) => {
        items.push({model, parentIds});
    });

    const instancesMap = await bulkFetchCollectionEntryPermissions({ctx, trx}, items);

    return entries.map((entry) => {
        const instance = instancesMap.get(entry.entryId);

        if (!instance) {
            return {
                ...makeEntryWithNoPermissions(entry, includePermissionsInfo),
                fullPermissions: includePermissionsInfo
                    ? getCollectionEntryDisabledPermissions(entry.scope as EntryScope)
                    : undefined,
            };
        }

        const permissions = getCollectionEntryPermissions(instance);

        return {
            ...entry,
            isLocked: !(permissions && permissions[permission]),
            permissions: includePermissionsInfo ? permissions : undefined,
            fullPermissions: includePermissionsInfo ? instance.permissions : undefined,
        };
    });
};

export const checkEntriesByPermission = async <T extends PartialEntry>(
    {ctx, trx}: ServiceArgs,
    args: CheckEntriesByPermissionArgs<T>,
): Promise<EntryWithPermissions<T, EntryFullPermissions>[]> => {
    const {entries, permission, includePermissionsInfo} = args;

    const workbookEntries: T[] = [];
    const folderEntries: T[] = [];
    const collectionEntries: T[] = [];

    entries.forEach((entry) => {
        if (entry.workbookId) {
            workbookEntries.push(entry);
        } else if (entry.collectionId) {
            collectionEntries.push(entry);
        } else {
            folderEntries.push(entry);
        }
    });

    const [folderEntriesResult, workbookEntriesResult, collectionEntriesResult] = await Promise.all(
        [
            checkFolderEntriesByPermission(
                {ctx, trx},
                {entries: folderEntries, permission, includePermissionsInfo},
            ),
            checkWorkbookEntriesByPermission(
                {ctx, trx},
                {entries: workbookEntries, permission, includePermissionsInfo},
            ),
            checkCollectionEntriesByPermission(
                {ctx, trx},
                {entries: collectionEntries, permission, includePermissionsInfo},
            ),
        ],
    );

    const result: EntryWithPermissions<T, EntryFullPermissions>[] = [
        ...folderEntriesResult,
        ...workbookEntriesResult,
        ...collectionEntriesResult,
    ];

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

export type CheckEntryByPermissionArgs<T> = {
    entry: T;
    permission?: UsPermissions;
    includePermissionsInfo?: boolean;
    throwPermissionError?: boolean;
};

export const checkEntryByPermission = async <T extends PartialEntry>(
    {ctx, mainTrx}: ServiceArgs<'mainTrx'>,
    args: CheckEntryByPermissionArgs<T>,
): Promise<EntryWithPermissions<T, EntryFullPermissions>> => {
    const {entry, permission, includePermissionsInfo, throwPermissionError = true} = args;

    const [checkedEntry] = await checkEntriesByPermission(
        {ctx, trx: mainTrx},
        {
            entries: [entry],
            permission,
            includePermissionsInfo,
        },
    );

    if (throwPermissionError && checkedEntry.isLocked) {
        throw new AccessServicePermissionDeniedError();
    }

    return checkedEntry;
};
