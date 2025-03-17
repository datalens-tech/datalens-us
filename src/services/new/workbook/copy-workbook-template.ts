import {AppError} from '@gravity-ui/nodekit';

import {US_ERRORS} from '../../../const';
import {WorkbookModel} from '../../../db/models/new/workbook';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

import {copyWorkbook} from './copy-workbook';

export interface CopyWorkbookTemplateArgs {
    workbookId: string;
    collectionId: Nullable<string>;
    title: string;
}

export const copyWorkbookTemplate = async (
    {ctx, trx, skipCheckPermissions = false}: ServiceArgs,
    args: CopyWorkbookTemplateArgs,
) => {
    const {workbookId, collectionId: newCollectionId, title: newTitle} = args;

    ctx.log('COPY_WORKBOOK_TEMPLATE_START', {
        workbookId: Utils.encodeId(workbookId),
        newCollectionId,
        newTitle,
    });

    const {tenantId} = ctx.get('info');

    const workbookModel = await WorkbookModel.query(getReplica(trx))
        .findById(workbookId)
        .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

    if (!workbookModel) {
        throw new AppError(US_ERRORS.WORKBOOK_NOT_EXISTS, {
            code: US_ERRORS.WORKBOOK_NOT_EXISTS,
        });
    }

    if (!workbookModel.isTemplate) {
        throw new AppError('Workbook template not exists', {
            code: US_ERRORS.WORKBOOK_TEMPLATE_NOT_EXISTS,
        });
    }

    const {workbook: newWorkbook, operation} = await copyWorkbook(
        {ctx, trx, skipCheckPermissions},
        {
            workbookId,
            title: newTitle,
            collectionId: newCollectionId,
            tenantIdOverride: tenantId,
        },
    );

    ctx.log('COPY_WORKBOOK_TEMPLATE_SUCCESS', {
        workbookId: Utils.encodeId(newWorkbook.workbookId),
    });

    return {
        workbook: newWorkbook,
        operation,
    };
};
