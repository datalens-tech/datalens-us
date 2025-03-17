import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {getAllWorkbooks} from '../../services/new/workbook';

import {WorkbookModelPageResponseModel, workbookModelPage} from './response-models';

const requestSchema = {
    query: z.object({
        page: zc.stringNumber().optional(),
        pageSize: zc.stringNumber().optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getAllWorkbooksController: AppRouteHandler = async (
    req,
    res: Response<WorkbookModelPageResponseModel>,
) => {
    const {query} = await parseReq(req);

    const result = await getAllWorkbooks(
        {ctx: req.ctx},
        {
            page: query.page,
            pageSize: query.pageSize,
        },
    );

    res.status(200).send(workbookModelPage.format(result));
};

getAllWorkbooksController.api = {
    summary: 'Get all workbooks',
    tags: [ApiTag.Workbooks],
    request: {
        query: requestSchema.query,
    },
    responses: {
        200: {
            description: workbookModelPage.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: workbookModelPage.schema,
                },
            },
        },
    },
};

getAllWorkbooksController.manualDecodeId = true;
