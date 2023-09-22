import {AppContext} from '@gravity-ui/nodekit';
import {TransactionOrKnex} from 'objection';
import {WorkbookPermission} from '../../../../entities/workbook';
import {getParentIds} from '../../collection/utils';
import type {WorkbookInstance} from '../../../../registry/common/entities/workbook/types';

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
