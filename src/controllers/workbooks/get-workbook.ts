import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {prepareResponseAsync} from '../../components/response-presenter';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {getWorkbook} from '../../services/new/workbook';
import {formatWorkbook} from '../../services/new/workbook/formatters';

import {WorkbookInstanceResponseModel, workbookModel} from './response-models';

const requestSchema = {
    params: z.object({
        workbookId: zc.encodedId(),
    }),
    query: z.object({
        includePermissionsInfo: zc.stringBoolean().optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getWorkbookController: AppRouteHandler = async (
    req,
    res: Response<WorkbookInstanceResponseModel>,
) => {
    const {params, query} = await parseReq(req);

    const result = await getWorkbook(
        {
            ctx: req.ctx,
        },
        {
            workbookId: params.workbookId,
            includePermissionsInfo: query.includePermissionsInfo,
        },
    );

    const formattedResponse = formatWorkbook(result);
    const {code, response} = await prepareResponseAsync({data: formattedResponse});

    res.status(code).send(response);
};

getWorkbookController.api = {
    summary: 'Get workbook',
    tags: [ApiTag.Workbooks],
    request: {
        params: requestSchema.params,
        query: requestSchema.query,
    },
    responses: {
        200: {
            description: workbookModel.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: workbookModel.schema,
                },
            },
        },
    },
};
