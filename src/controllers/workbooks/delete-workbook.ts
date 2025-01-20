import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {deleteWorkbooks} from '../../services/new/workbook';

import {WorkbookResponseModel, workbookModel} from './response-models';

const requestSchema = {
    params: z.object({
        workbookId: zc.encodedId(),
    }),
};

const parseReq = makeReqParser(requestSchema);

const controller: AppRouteHandler = async (req, res: Response<WorkbookResponseModel>) => {
    const {params} = await parseReq(req);

    const result = await deleteWorkbooks(
        {
            ctx: req.ctx,
        },
        {
            workbookIds: [params.workbookId],
        },
    );

    res.status(200).send(workbookModel.format(result.workbooks[0]));
};

controller.api = {
    summary: 'Delete workbook',
    tags: [ApiTag.Workbooks],
    request: {
        params: requestSchema.params,
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

controller.manualDecodeId = true;

export {controller as deleteWorkbook};
