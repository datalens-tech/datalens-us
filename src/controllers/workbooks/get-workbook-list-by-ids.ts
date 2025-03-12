import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {prepareResponseAsync} from '../../components/response-presenter';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {formatWorkbookModel} from '../../services/new/workbook/formatters';
import {getWorkbooksListByIds} from '../../services/new/workbook/get-workbooks-list-by-ids';

import {WorkbookArrayResponseModel, WorkbookModelArray} from './response-models';

const requestSchema = {
    body: z.object({
        workbookIds: zc.encodedIdArray({min: 1, max: 1000}),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getWorkbookListByIdsController: AppRouteHandler = async (
    req,
    res: Response<WorkbookArrayResponseModel>,
) => {
    const {body} = await parseReq(req);

    const result = await getWorkbooksListByIds(
        {ctx: req.ctx},
        {
            workbookIds: body.workbookIds,
        },
    );

    const formattedResponse = result.map((instance) => formatWorkbookModel(instance.model));
    const {code, response} = await prepareResponseAsync({data: formattedResponse});
    res.status(code).send(response);
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
            description: WorkbookModelArray.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: WorkbookModelArray.schema,
                },
            },
        },
    },
};

getWorkbookListByIdsController.manualDecodeId = true;
