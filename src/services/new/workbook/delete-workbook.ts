import {AppError} from '@gravity-ui/nodekit';
import {getWorkbook} from './get-workbook';
import {getParentIds} from '../collection/utils/get-parents';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {US_ERRORS, CURRENT_TIMESTAMP} from '../../../const';
import {raw, transaction} from 'objection';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import Lock from '../../../db/models/lock';
import {Entry} from '../../../db/models/new/entry';
import Utils, {logInfo, makeUserId} from '../../../utils';
import {WorkbookPermission} from '../../../entities/workbook';
import {markEntryAsDeleted} from '../../entry/crud';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['workbookId'],
    properties: {
        workbookId: {
            type: 'string',
        },
    },
});

export interface DeleteWorkbookArgs {
    workbookId: string;
}

export const deleteWorkbook = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: DeleteWorkbookArgs,
) => {
    const {workbookId} = args;

    logInfo(ctx, 'DELETE_WORKBOOK_START', {
        workbookId: Utils.encodeId(workbookId),
    });

    if (!skipValidation) {
        validateArgs(args);
    }

    const {accessServiceEnabled} = ctx.config;

    const {
        user: {userId},
    } = ctx.get('info');

    const targetTrx = getPrimary(trx);

    const workbook = await getWorkbook(
        {ctx, trx: targetTrx, skipValidation: true, skipCheckPermissions: true},
        {workbookId},
    );

    if (workbook.model.isTemplate) {
        throw new AppError("Workbook template can't be deleted", {
            code: US_ERRORS.WORKBOOK_TEMPLATE_CANT_BE_DELETED,
        });
    }

    if (accessServiceEnabled && !skipCheckPermissions) {
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
            permission: WorkbookPermission.Delete,
        });
    }

    const result = await transaction(targetTrx, async (transactionTrx) => {
        const deletedWorkbook = await WorkbookModel.query(transactionTrx)
            .patch({
                [WorkbookModelColumn.DeletedBy]: userId,
                [WorkbookModelColumn.DeletedAt]: raw(CURRENT_TIMESTAMP),
            })
            .where({
                [WorkbookModelColumn.WorkbookId]: workbook.model.workbookId,
            })
            .returning('*')
            .first()
            .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

        const entries = await Entry.query(transactionTrx)
            .select()
            .where({workbookId, isDeleted: false})
            .timeout(Entry.DEFAULT_QUERY_TIMEOUT);

        const entryDeletedBy = makeUserId(userId);

        await Promise.all(
            entries.map(async (entry) => {
                const {entryId, displayKey, key} = entry;

                await Lock.checkLock({entryId}, ctx);

                const newInnerMeta = {
                    ...entry.innerMeta,
                    oldKey: key as string,
                    oldDisplayKey: displayKey as string,
                };

                return markEntryAsDeleted(transactionTrx, {
                    entryId,
                    newKey: key as string,
                    newDisplayKey: displayKey as string,
                    newInnerMeta,
                    updatedBy: entryDeletedBy,
                });
            }),
        );

        return deletedWorkbook;
    });

    if (!result) {
        throw new AppError(US_ERRORS.WORKBOOK_NOT_EXISTS, {
            code: US_ERRORS.WORKBOOK_NOT_EXISTS,
        });
    }

    logInfo(ctx, 'DELETE_WORKBOOK_FINISH', {
        workbookId: Utils.encodeId(result.workbookId),
    });

    return result;
};
