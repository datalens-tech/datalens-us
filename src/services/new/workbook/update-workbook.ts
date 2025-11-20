import {AppError} from '@gravity-ui/nodekit';
import {raw} from 'objection';

import {CURRENT_TIMESTAMP, US_ERRORS} from '../../../const';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import {WorkbookStatus} from '../../../db/models/new/workbook/types';
import {WorkbookPermission} from '../../../entities/workbook';
import Utils from '../../../utils';
import {getParentIds} from '../collection/utils';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';

import {checkWorkbookByTitle} from './check-workbook-by-title';
import {getWorkbook} from './get-workbook';

export interface UpdateWorkbookArgs {
    workbookId: string;
    title?: string;
    description?: string;
    status?: WorkbookStatus;
    meta?: Record<string, unknown>;
}

export const updateWorkbook = async (
    {ctx, trx, checkLicense, skipCheckPermissions = false}: ServiceArgs,
    args: UpdateWorkbookArgs,
) => {
    const {
        workbookId,
        title: newTitle,
        description: newDescription,
        status: newStatus,
        meta: newMeta,
    } = args;

    ctx.log('UPDATE_WORKBOOK_START', {
        workbookId: Utils.encodeId(workbookId),
        newTitle,
        newDescription,
        newStatus,
        newMeta,
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

    const targetTrx = getPrimary(trx);

    const workbook = await getWorkbook(
        {
            ctx,
            trx: targetTrx,
            skipValidation: true,
            skipCheckPermissions: true,
        },
        {workbookId},
    );

    if (accessServiceEnabled && !skipCheckPermissions && !isPrivateRoute) {
        let parentIds: string[] = [];

        if (workbook.model.collectionId !== null) {
            parentIds = await getParentIds({
                ctx,
                trx: targetTrx,
                collectionId: workbook.model.collectionId,
            });
        }

        await workbook.checkPermission({
            parentIds,
            permission: WorkbookPermission.Update,
        });
    }

    if (newTitle && newTitle.toLowerCase() !== workbook.model.titleLower) {
        const checkWorkbookByTitleResult = await checkWorkbookByTitle(
            {
                ctx,
                trx: targetTrx,
                skipValidation: true,
                skipCheckPermissions,
            },
            {
                title: newTitle,
                collectionId: workbook.model.collectionId,
            },
        );

        if (checkWorkbookByTitleResult === true) {
            throw new AppError(US_ERRORS.WORKBOOK_ALREADY_EXISTS, {
                code: US_ERRORS.WORKBOOK_ALREADY_EXISTS,
            });
        }
    }

    const patchedWorkbook = await WorkbookModel.query(targetTrx)
        .patch({
            [WorkbookModelColumn.Title]: newTitle,
            [WorkbookModelColumn.TitleLower]: newTitle?.toLowerCase(),
            [WorkbookModelColumn.Description]: newDescription,
            [WorkbookModelColumn.UpdatedBy]: userId,
            [WorkbookModelColumn.UpdatedAt]: raw(CURRENT_TIMESTAMP),
            [WorkbookModelColumn.Status]: newStatus,
            [WorkbookModelColumn.Meta]: newMeta,
        })
        .where({
            [WorkbookModelColumn.WorkbookId]: workbookId,
        })
        .returning('*')
        .first()
        .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

    if (!patchedWorkbook) {
        throw new AppError(US_ERRORS.WORKBOOK_NOT_EXISTS, {
            code: US_ERRORS.WORKBOOK_NOT_EXISTS,
        });
    }

    ctx.log('UPDATE_WORKBOOK_FINISH', {
        workbookId: Utils.encodeId(patchedWorkbook.workbookId),
    });

    return patchedWorkbook;
};
