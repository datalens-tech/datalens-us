import {AppError} from '@gravity-ui/nodekit';
import {transaction} from 'objection';

import {US_ERRORS} from '../../../const';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import {WorkbookStatus} from '../../../db/models/new/workbook/types';
import Utils from '../../../utils';
import {getParentIds} from '../collection/utils/get-parents';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';

import {checkWorkbookByTitle} from './check-workbook-by-title';

export interface CreateWorkbookArgs {
    collectionId: Nullable<string>;
    title: string;
    description?: string;
    meta?: Record<string, unknown>;
    status?: WorkbookStatus;
}

export const createWorkbook = async (
    {ctx, trx, skipCheckPermissions = false}: ServiceArgs,
    args: CreateWorkbookArgs,
) => {
    const {title, description, collectionId, meta} = args;

    ctx.log('CREATE_WORKBOOK_START', {
        title,
        description,
        collectionId: collectionId ? Utils.encodeId(collectionId) : null,
    });

    const {accessServiceEnabled, accessBindingsServiceEnabled} = ctx.config;

    const {
        user: {userId},
        tenantId,
        isPrivateRoute,
    } = ctx.get('info');
    const registry = ctx.get('registry');

    const targetTrx = getPrimary(trx);

    let parentIds: string[] = [];

    if (collectionId !== null) {
        parentIds = await getParentIds({
            ctx,
            trx: targetTrx,
            collectionId,
        });

        if (parentIds.length === 0) {
            throw new AppError(`Cannot find parent collection with id – ${collectionId}`, {
                code: US_ERRORS.COLLECTION_NOT_EXISTS,
            });
        }
    }

    const checkWorkbookByTitleResult = await checkWorkbookByTitle(
        {
            ctx,
            trx: targetTrx,
            skipValidation: true,
            skipCheckPermissions: skipCheckPermissions || accessBindingsServiceEnabled,
        },
        {
            title,
            collectionId,
        },
    );

    if (checkWorkbookByTitleResult === true) {
        throw new AppError(`Workbook with title "${title}" already exists in this scope`, {
            code: US_ERRORS.WORKBOOK_ALREADY_EXISTS,
        });
    }

    let operation: any;

    const result = await transaction(targetTrx, async (transactionTrx) => {
        ctx.log('CREATE_WORKBOOK_IN_DB_START');

        const model = await WorkbookModel.query(transactionTrx)
            .insert({
                [WorkbookModelColumn.Title]: title,
                [WorkbookModelColumn.TitleLower]: title.toLowerCase(),
                [WorkbookModelColumn.Description]: description ?? null,
                [WorkbookModelColumn.TenantId]: tenantId,
                [WorkbookModelColumn.CollectionId]: collectionId,
                [WorkbookModelColumn.CreatedBy]: userId,
                [WorkbookModelColumn.UpdatedBy]: userId,
                [WorkbookModelColumn.Meta]: meta,
            })
            .returning('*')
            .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

        ctx.log('CREATE_WORKBOOK_IN_DB_FINISH', {
            workbookId: Utils.encodeId(model.workbookId),
        });

        const {Workbook} = registry.common.classes.get();

        const workbook = new Workbook({
            ctx,
            model,
        });

        if (accessServiceEnabled && accessBindingsServiceEnabled && !isPrivateRoute) {
            operation = await workbook.register({
                parentIds,
            });
        }

        return workbook;
    });

    ctx.log('CREATE_WORKBOOK_FINISH', {
        workbookId: Utils.encodeId(result.model.workbookId),
    });

    return {
        workbook: result,
        operation,
    };
};
