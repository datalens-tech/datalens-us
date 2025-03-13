import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {getWorkbooksListByIds} from '../../services/new/workbook/get-workbooks-list-by-ids';

import {WorkbookInstanceArray, WorkbookInstanceArrayResponseModel} from './response-models';

const requestSchema = {
    body: z.object({
        workbookIds: zc.encodedIdArray({min: 1, max: 1000}),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getWorkbookListByIdsController: AppRouteHandler = async (
    req,
    res: Response<WorkbookInstanceArrayResponseModel>,
) => {
    const {body} = await parseReq(req);

    const result = await getWorkbooksListByIds(
        {ctx: req.ctx},
        {
            workbookIds: body.workbookIds,
        },
    );

    res.status(200).send(WorkbookInstanceArray.format(result));
};

getWorkbookListByIdsController.api = {
    summary: 'Get workbook list by Ids',
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
            description: WorkbookInstanceArray.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: WorkbookInstanceArray.schema,
                },
            },
        },
    },
};

getWorkbookListByIdsController.manualDecodeId = true;
