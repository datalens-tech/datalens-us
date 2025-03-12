import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {prepareResponseAsync} from '../../components/response-presenter';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {getAllWorkbooks} from '../../services/new/workbook';
import {formatWorkbookModelsList} from '../../services/new/workbook/formatters';

import {
    WorkbookInstanceArrayWithNextPageToken,
    WorkbookInstanceArrayWithNextPageTokenResponseModel,
} from './response-models';

const requestSchema = {
    query: z.object({
        page: zc.stringNumber().optional(),
        pageSize: zc.stringNumber().optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getAllWorkbooksController: AppRouteHandler = async (
    req,
    res: Response<WorkbookInstanceArrayWithNextPageTokenResponseModel>,
) => {
    const {query} = await parseReq(req);

    const result = await getAllWorkbooks(
        {ctx: req.ctx},
        {
            page: query.page,
            pageSize: query.pageSize,
        },
    );

    const formattedResponse = formatWorkbookModelsList(result);
    const {code, response} = await prepareResponseAsync({data: formattedResponse});
    res.status(code).send(response);
};

getAllWorkbooksController.api = {
    summary: 'Get all workbooks',
    tags: [ApiTag.Workbooks],
    request: {
        query: requestSchema.query,
    },
    responses: {
        200: {
            description: WorkbookInstanceArrayWithNextPageToken.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: WorkbookInstanceArrayWithNextPageToken.schema,
                },
            },
        },
    },
};
