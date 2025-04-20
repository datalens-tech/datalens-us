import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {getWorkbooksListByIds} from '../../services/new/workbook';

import {WorkbookModelArray, workbookModelArray} from './response-models';

const requestSchema = {
    body: z.object({
        workbookIds: zc.encodedIdArray({min: 1, max: 1000}),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getWorkbooksListByIdsController: AppRouteHandler = async (
    req,
    res: Response<WorkbookModelArray>,
) => {
    const {body} = await parseReq(req);

    const result = await getWorkbooksListByIds(
        {ctx: req.ctx},
        {
            workbookIds: body.workbookIds,
        },
    );

    res.status(200).send(await workbookModelArray.format(result.map((instance) => instance.model)));
};

getWorkbooksListByIdsController.api = {
    summary: 'Get workbook list by ids',
    tags: [ApiTag.Workbooks],
    request: {
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
            description: `${workbookModelArray.schema.description}`,
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: workbookModelArray.schema,
                },
            },
        },
    },
};

getWorkbooksListByIdsController.manualDecodeId = true;
