import {AppContext} from '@gravity-ui/nodekit';
import {TransactionOrKnex} from 'objection';

import {WorkbookPermission} from '../../../../entities/workbook';
import type {WorkbookInstance} from '../../../../registry/common/entities/workbook/types';
import {getWorkbook} from '../../../../services/new/workbook';
import {getParentIds} from '../../collection/utils';

export const checkWorkbookPermission = async ({
    ctx,
    trx,
    workbook,
    permission,
}: {
    ctx: AppContext;
    trx?: TransactionOrKnex;
    workbook: WorkbookInstance;
    permission: WorkbookPermission;
}) => {
    let parentIds: string[] = [];

    if (workbook.model.collectionId !== null) {
        parentIds = await getParentIds({
            ctx,
            trx,
            collectionId: workbook.model.collectionId,
        });
    }

    await workbook.checkPermission({
        parentIds,
        permission,
    });
};

export const checkWorkbookPermissionById = async ({
    ctx,
    trx,
    workbookId,
    permission,
}: {
    ctx: AppContext;
    trx?: TransactionOrKnex;
    workbookId: string;
    permission: WorkbookPermission;
}) => {
    const workbook = await getWorkbook(
        {ctx, skipValidation: true, skipCheckPermissions: true},
        {workbookId},
    );

    await checkWorkbookPermission({ctx, trx, workbook, permission});
};
