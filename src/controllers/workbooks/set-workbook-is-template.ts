import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {setWorkbookIsTemplate} from '../../services/new/workbook';

import {WorkbookIdWithTemplateModel, workbookIdWithTemplateModel} from './response-models';

const requestSchema = {
    params: z.object({
        workbookId: zc.encodedId(),
    }),
    body: z.object({
        isTemplate: z.boolean(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const setWorkbookIsTemplateController: AppRouteHandler = async (
    req,
    res: Response<WorkbookIdWithTemplateModel>,
) => {
    const {body, params} = await parseReq(req);

    const result = await setWorkbookIsTemplate(
        {
            ctx: req.ctx,
        },
        {
            workbookId: params.workbookId,
            isTemplate: body.isTemplate,
        },
    );

    res.status(200).send(workbookIdWithTemplateModel.format(result));
};

setWorkbookIsTemplateController.api = {
    summary: 'Set workbook isTemplate flag',
    tags: [ApiTag.Workbooks],
    request: {
        params: requestSchema.params,
        body: {
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: requestSchema.body,
                },
            },
        },
    },
    responses: {
        200: {
            description: `${workbookIdWithTemplateModel.schema.description}`,
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: workbookIdWithTemplateModel.schema,
                },
            },
        },
    },
};

setWorkbookIsTemplateController.manualDecodeId = true;
