import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {WorkbookModel} from '../../../db/models/new/workbook';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['workbookId', 'isTemplate'],
    properties: {
        workbookId: {
            type: 'string',
        },
        isTemplate: {
            type: 'boolean',
        },
    },
});

export interface SetWorkbookIsTemplateArgs {
    workbookId: string;
    isTemplate: boolean;
}

export const setWorkbookIsTemplate = async (
    {ctx, trx, skipValidation = false}: ServiceArgs,
    args: SetWorkbookIsTemplateArgs,
) => {
    const {workbookId, isTemplate} = args;

    ctx.log('SET_WORKBOOK_IS_TEMPLATE_START', {
        workbookId: Utils.encodeId(workbookId),
        isTemplate,
    });

    if (!skipValidation) {
        validateArgs(args);
    }

    const workbook = await WorkbookModel.query(getPrimary(trx)).patchAndFetchById(workbookId, {
        isTemplate,
    });

    ctx.log('SET_WORKBOOK_IS_TEMPLATE_FINISH', {
        workbookId: Utils.encodeId(workbookId),
        isTemplate: workbook.isTemplate,
    });

    return workbook;
};
