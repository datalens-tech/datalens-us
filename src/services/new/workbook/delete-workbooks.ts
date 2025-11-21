import {AppError} from '@gravity-ui/nodekit';
import {transaction} from 'objection';

import {US_ERRORS} from '../../../const';
import Lock from '../../../db/models/lock';
import {Entry, EntryColumn} from '../../../db/models/new/entry';
import {WorkbookPermission} from '../../../entities/workbook';
import {WorkbookInstance} from '../../../registry/plugins/common/entities/workbook/types';
import Utils, {makeUserId} from '../../../utils';
import {markEntriesAsDeleted} from '../../entry/crud';
import {getParentIds} from '../collection/utils/get-parents';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';

import {getWorkbooksListByIds} from './get-workbooks-list-by-ids';
import {markWorkbooksAsDeleted} from './utils';

export interface DeleteWorkbooksArgs {
    workbookIds: string[];
    detachDeletePermissions?: boolean;
}

export const deleteWorkbooks = async (
    {ctx, trx, checkLicense, skipCheckPermissions = false}: ServiceArgs,
    args: DeleteWorkbooksArgs,
) => {
    const {workbookIds, detachDeletePermissions = false} = args;

    ctx.log('DELETE_WORKBOOKS_START', {
        workbookIds: await Utils.macrotasksMap(workbookIds, (id) => Utils.encodeId(id)),
    });

    const {accessServiceEnabled} = ctx.config;

    const {
        user: {userId},
        isPrivateRoute,
    } = ctx.get('info');

    const registry = ctx.get('registry');

    const {fetchAndValidateLicenseOrFail} = registry.common.functions.get();

    if (!isPrivateRoute && checkLicense) {
        await fetchAndValidateLicenseOrFail({ctx});
    }

    const workbooks = await getWorkbooksListByIds(
        {ctx, trx: getPrimary(trx), skipValidation: true, skipCheckPermissions: true},
        {workbookIds},
    );

    const workbooksMap: Map<WorkbookInstance, string[]> = new Map();

    const checkDeletePermissionPromises = workbooks.map(async (workbook) => {
        if (workbook.model.isTemplate) {
            throw new AppError("Workbook template can't be deleted", {
                code: US_ERRORS.WORKBOOK_TEMPLATE_CANT_BE_DELETED,
            });
        }

        let parentIds: string[] = [];

        if (workbook.model.collectionId !== null) {
            parentIds = await getParentIds({
                ctx,
                trx: getPrimary(trx),
                collectionId: workbook.model.collectionId,
            });
        }

        if (accessServiceEnabled && !skipCheckPermissions && !isPrivateRoute) {
            await workbook.checkPermission({
                parentIds,
                permission: WorkbookPermission.Delete,
            });
        }

        workbooksMap.set(workbook, parentIds);
    });

    await Promise.all(checkDeletePermissionPromises);

    const result = await transaction(getPrimary(trx), async (transactionTrx) => {
        const deletedWorkbooks = await markWorkbooksAsDeleted(
            {ctx, trx: transactionTrx, skipCheckPermissions: true},
            {workbooksMap, detachDeletePermissions: true},
        );

        const entries = await Entry.query(transactionTrx)
            .select()
            .where({isDeleted: false})
            .whereIn([EntryColumn.WorkbookId], workbookIds)
            .timeout(Entry.DEFAULT_QUERY_TIMEOUT);

        await Lock.bulkCheckLock(
            entries.map((entry) => ({entryId: entry.entryId})),
            ctx,
        );

        const data = entries.map((entry) => ({
            entryId: entry.entryId,
            newKey: entry.key as string,
            newDisplayKey: entry.displayKey as string,
            updatedBy: makeUserId(userId),
            newInnerMeta: {
                ...entry.innerMeta,
                oldKey: entry.key as string,
                oldDisplayKey: entry.displayKey as string,
            },
            scope: entry.scope,
            type: entry.type,
            createdBy: entry.createdBy,
        }));

        await markEntriesAsDeleted({ctx, trx: transactionTrx}, data);

        return deletedWorkbooks;
    });

    if (!detachDeletePermissions) {
        await result.deletePermissions?.();
    }

    ctx.log('DELETE_WORKBOOKS_FINISH', {
        workbookIds: await Utils.macrotasksMap(result.workbooks, (workbook) =>
            Utils.encodeId(workbook.workbookId),
        ),
    });

    return {
        workbooks: result.workbooks,
        deletePermissions: detachDeletePermissions ? result.deletePermissions : undefined,
    };
};
