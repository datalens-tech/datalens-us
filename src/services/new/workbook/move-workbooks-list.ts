import {transaction} from 'objection';

import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';

import {moveWorkbook} from './move-workbook';

export interface MoveListWorkbooksArgs {
    workbookIds: string[];
    collectionId: Nullable<string>;
}

export const moveWorkbooksList = async (
    {ctx, trx, skipCheckPermissions = false}: ServiceArgs,
    args: MoveListWorkbooksArgs,
) => {
    const {workbookIds, collectionId} = args;

    const targetTrx = getPrimary(trx);

    ctx.log('MOVE_LIST_WORKBOOKS_START', {
        workbookIds: await Utils.macrotasksMap(workbookIds, (id) => Utils.encodeId(id)),
        collectionId: Utils.encodeId(collectionId),
    });

    const result = await transaction(targetTrx, async (transactionTrx) => {
        return await Promise.all(
            workbookIds.map(
                async (workbookId: string) =>
                    await moveWorkbook(
                        {
                            ctx,
                            trx: transactionTrx,
                            skipCheckPermissions,
                        },
                        {
                            workbookId,
                            collectionId,
                        },
                    ),
            ),
        );
    });

    ctx.log('MOVE_LIST_WORKBOOKS_END', {
        workbookIds: await Utils.macrotasksMap(result, (workbook) =>
            Utils.encodeId(workbook.workbookId),
        ),
        collectionId: Utils.encodeId(collectionId),
    });

    return {
        workbooks: result,
    };
};
