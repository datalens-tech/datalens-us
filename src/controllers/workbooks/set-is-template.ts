import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {prepareResponseAsync} from '../../components/response-presenter';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {setWorkbookIsTemplate} from '../../services/new/workbook';
import {formatSetWorkbookIsTemplate} from '../../services/new/workbook/formatters';

import {WorkbookIdWithTemplateModel, WorkbookIdWithTemplateResponseModel} from './response-models';

const requestSchema = {
    params: z.object({
        workbookId: zc.encodedId(),
    }),
    body: z.object({
        isTemplate: z.boolean(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const setIsTemplateController: AppRouteHandler = async (
    req,
    res: Response<WorkbookIdWithTemplateResponseModel>,
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

    const formattedResponse = formatSetWorkbookIsTemplate(result);
    const {code, response} = await prepareResponseAsync({data: formattedResponse});
    res.status(code).send(response);
};

setIsTemplateController.api = {
    summary: 'Set is workbook template',
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
            description: WorkbookIdWithTemplateModel.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: WorkbookIdWithTemplateModel.schema,
                },
            },
        },
    },
};

setIsTemplateController.manualDecodeId = true;
