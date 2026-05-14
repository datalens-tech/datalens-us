import {AppError} from '@gravity-ui/nodekit';

import {US_ERRORS} from '../../../../const/errors';
import {Entry, EntryColumn} from '../../../../db/models/new/entry';
import {SharedEntryPermission} from '../../../../entities/shared-entry';
import {WorkbookPermission} from '../../../../entities/workbook';
import {checkSharedEntryPermission} from '../../entry/utils/check-collection-entry-permission/check-permission';
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
        throw new AppError(US_ERRORS.NOT_EXIST_ENTRY, {
            code: US_ERRORS.NOT_EXIST_ENTRY,
        });
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
            await checkSharedEntryPermission(
                {ctx},
                {
                    entry,
                    permission:
                        permission === 'read'
                            ? SharedEntryPermission.View
                            : SharedEntryPermission.Update,
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
