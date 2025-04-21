import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {getAllWorkbooks} from '../../services/new/workbook';

import {WorkbookModelPage, workbookModelPage} from './response-models';

const requestSchema = {
    query: z.object({
        page: zc.stringNumber({min: 0}).optional(),
        pageSize: zc.stringNumber({min: 1, max: 1000}).optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getAllWorkbooksController: AppRouteHandler = async (
    req,
    res: Response<WorkbookModelPage>,
) => {
    const {query} = await parseReq(req);

    const result = await getAllWorkbooks(
        {ctx: req.ctx},
        {
            page: query.page,
            pageSize: query.pageSize,
        },
    );

    res.status(200).send(await workbookModelPage.format(result));
};

getAllWorkbooksController.api = {
    summary: 'Get all workbooks',
    tags: [ApiTag.Workbooks],
    request: {
        query: requestSchema.query,
    },
    responses: {
        200: {
            description: `${workbookModelPage.schema.description}`,
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: workbookModelPage.schema,
                },
            },
        },
    },
};

getAllWorkbooksController.manualDecodeId = true;
