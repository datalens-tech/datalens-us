import {getPrimary} from '../utils';
import {transaction} from 'objection';

import {ServiceArgs} from '../types';

import {makeSchemaValidator} from '../../../components/validation-schema-compiler';

import Utils, {logInfo} from '../../../utils';

import {moveWorkbook} from './move-workbook';

export interface MoveListWorkbooksArgs {
    workbookIds: string[];
    collectionId: Nullable<string>;
}

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['workbookIds', 'collectionId'],
    properties: {
        workbookIds: {
            type: 'array',
            items: {type: 'string'},
        },
        collectionId: {
            type: ['string', 'null'],
        },
    },
});

export const moveWorkbooksList = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: MoveListWorkbooksArgs,
) => {
    const {workbookIds, collectionId} = args;

    if (!skipValidation) {
        validateArgs(args);
    }

    const targetTrx = getPrimary(trx);

    logInfo(ctx, 'MOVE_LIST_WORKBOOKS_START', {
        workbookIds,
        collectionId: Utils.encodeId(collectionId),
    });

    const ids = await Utils.macrotasksMap(workbookIds, (id) => Utils.decodeId(id));

    const result = await transaction(targetTrx, async (transactionTrx) => {
        return await Promise.all(
            ids.map(
                async (workbookId: string) =>
                    await moveWorkbook(
                        {
                            ctx,
                            trx: transactionTrx,
                            skipValidation,
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
