import {AppError} from '@gravity-ui/nodekit';
import {getWorkbook} from './get-workbook';
import {checkWorkbookByTitle} from './check-workbook-by-title';
import {getParentIds} from '../collection/utils';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {CURRENT_TIMESTAMP, US_ERRORS} from '../../../const';
import {raw} from 'objection';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import Utils, {logInfo} from '../../../utils';
import {WorkbookPermission} from '../../../entities/workbook';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['workbookId'],
    properties: {
        workbookId: {
            type: 'string',
        },
        title: {
            type: 'string',
        },
        description: {
            type: 'string',
        },
    },
});

export interface UpdateWorkbookArgs {
    workbookId: string;
    title?: string;
    description?: string;
}

export const updateWorkbook = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: UpdateWorkbookArgs,
) => {
    const {workbookId, title: newTitle, description: newDescription} = args;

    logInfo(ctx, 'UPDATE_WORKBOOK_START', {
        workbookId: Utils.encodeId(workbookId),
        newTitle,
        newDescription,
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

    logInfo(ctx, 'UPDATE_WORKBOOK_FINISH', {
        workbookId: Utils.encodeId(patchedWorkbook.workbookId),
    });

    return patchedWorkbook;
};
