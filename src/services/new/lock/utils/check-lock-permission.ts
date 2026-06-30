import {NotExistEntryError} from '../../../../components/errors';
import {Entry, EntryColumn} from '../../../../db/models/new/entry';
import {WorkbookPermission} from '../../../../entities/workbook';
import {
    CollectionEntryPermissions,
    checkCollectionEntryPermission,
} from '../../entry/collection-entry';
import {ServiceArgs} from '../../types';
import {getReplica} from '../../utils';
import {getWorkbook} from '../../workbook';
import {checkWorkbookPermission} from '../../workbook/utils/check-workbook-permission';

export const checkLockPermission = async (
    {ctx}: ServiceArgs,
    {entryId, permission}: {entryId: string; permission: 'read' | 'edit'},
) => {
    const registry = ctx.get('registry');
    const {accessServiceEnabled} = ctx.config;
    const {tenantId} = ctx.get('info');

    const entry = await Entry.query(getReplica())
        .where({
            [EntryColumn.EntryId]: entryId,
            [EntryColumn.TenantId]: tenantId,
            [EntryColumn.IsDeleted]: false,
        })
        .first()
        .timeout(Entry.DEFAULT_QUERY_TIMEOUT);

    if (!entry) {
        throw new NotExistEntryError();
    }

    if (entry.workbookId) {
        if (accessServiceEnabled) {
            const workbook = await getWorkbook(
                {ctx, skipCheckPermissions: true},
                {workbookId: entry.workbookId},
            );

            await checkWorkbookPermission({
                ctx,
                workbook,
                permission:
                    permission === 'read'
                        ? WorkbookPermission.LimitedView
                        : WorkbookPermission.Update,
            });
        }
    } else if (entry.collectionId) {
        if (accessServiceEnabled) {
            await checkCollectionEntryPermission(
                {ctx},
                {
                    entry,
                    permission:
                        permission === 'read'
                            ? CollectionEntryPermissions.Read
                            : CollectionEntryPermissions.Edit,
                },
            );
        }
    } else if (ctx.config.dlsEnabled) {
        const {DLS} = registry.common.classes.get();
        await DLS.checkPermission(
            {ctx},
            {
                entryId,
                action: permission,
            },
        );
    }
};
