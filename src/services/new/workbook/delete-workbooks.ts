import {AppError} from '@gravity-ui/nodekit';
import {getParentIds} from '../collection/utils/get-parents';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {US_ERRORS, CURRENT_TIMESTAMP} from '../../../const';
import {raw, transaction} from 'objection';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import Lock from '../../../db/models/lock';
import {Entry, EntryColumn} from '../../../db/models/new/entry';
import Utils, {makeUserId} from '../../../utils';
import {WorkbookPermission} from '../../../entities/workbook';
import {markEntryAsDeleted} from '../../entry/crud';
import {getWorkbooksListByIds} from './get-workbooks-list-by-ids';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['workbookIds'],
    properties: {
        workbookIds: {
            type: 'array',
            items: {
                type: 'string',
            },
        },
    },
});

export interface DeleteWorkbooksArgs {
    workbookIds: string[];
}

export const deleteWorkbooks = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: DeleteWorkbooksArgs,
) => {
    const {workbookIds} = args;

    ctx.log('DELETE_WORKBOOKS_START', {
        workbookIds: await Utils.macrotasksMap(workbookIds, (id) => Utils.encodeId(id)),
    });

    if (!skipValidation) {
        validateArgs(args);
    }

    const {accessServiceEnabled} = ctx.config;

    const {
        user: {userId},
    } = ctx.get('info');

    const targetTrx = getPrimary(trx);

    const workbooks = await getWorkbooksListByIds(
        {ctx, trx: targetTrx, skipValidation: true, skipCheckPermissions: true},
        {workbookIds},
    );

    const checkDeletePermissionPromises = workbooks.map(async (workbook) => {
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
    });

    await Promise.all(checkDeletePermissionPromises);

    const result = await transaction(targetTrx, async (transactionTrx) => {
        const deletedWorkbooks = await WorkbookModel.query(transactionTrx)
            .patch({
                [WorkbookModelColumn.DeletedBy]: userId,
                [WorkbookModelColumn.DeletedAt]: raw(CURRENT_TIMESTAMP),
            })
            .whereIn([WorkbookModelColumn.WorkbookId], workbookIds)
            .returning('*')
            .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

        const entries = await Entry.query(transactionTrx)
            .select()
            .where({isDeleted: false})
            .whereIn([EntryColumn.WorkbookId], workbookIds)
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

        return deletedWorkbooks;
    });

    if (!result) {
        throw new AppError(US_ERRORS.WORKBOOK_NOT_EXISTS, {
            code: US_ERRORS.WORKBOOK_NOT_EXISTS,
        });
    }

    ctx.log('DELETE_WORKBOOKS_FINISH', {
        workbookIds: await Utils.macrotasksMap(result, (workbook) =>
            Utils.encodeId(workbook.workbookId),
        ),
    });

    return {
        workbooks: result,
    };
};
