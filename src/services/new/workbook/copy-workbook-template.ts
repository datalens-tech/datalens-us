import {AppError} from '@gravity-ui/nodekit';
import {WorkbookModel} from '../../../db/models/new/workbook';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';
import Utils from '../../../utils';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {copyWorkbook} from './copy-workbook';
import {US_ERRORS} from '../../../const';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['workbookId', 'collectionId', 'title'],
    properties: {
        workbookId: {
            type: 'string',
        },
        collectionId: {
            type: ['string', 'null'],
        },
        title: {
            type: 'string',
        },
    },
});

export interface CopyWorkbookTemplateArgs {
    workbookId: string;
    collectionId: Nullable<string>;
    title: string;
}

export const copyWorkbookTemplate = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: CopyWorkbookTemplateArgs,
) => {
    const {workbookId, collectionId: newCollectionId, title: newTitle} = args;

    ctx.log('COPY_WORKBOOK_TEMPLATE_START', {
        workbookId: Utils.encodeId(workbookId),
        newCollectionId,
        newTitle,
    });

    if (!skipValidation) {
        validateArgs(args);
    }

    const {tenantId, projectId} = ctx.get('info');

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
        {ctx, trx, skipValidation, skipCheckPermissions},
        {
            workbookId,
            title: newTitle,
            collectionId: newCollectionId,
            projectIdOverride: projectId,
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
