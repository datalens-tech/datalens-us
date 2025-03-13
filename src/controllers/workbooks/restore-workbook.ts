import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {restoreWorkbook} from '../../services/new/workbook';

import {WorkbookIdModel, WorkbookIdResponseModel} from './response-models';

const requestSchema = {
    params: z.object({
        workbookId: zc.encodedId(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const restoreWorkbookController: AppRouteHandler = async (
    req,
    res: Response<WorkbookIdResponseModel>,
) => {
    const {params} = await parseReq(req);

    const result = await restoreWorkbook(
        {
            ctx: req.ctx,
        },
        {
            workbookId: params.workbookId,
        },
    );

    res.status(200).send(WorkbookIdModel.format(result));
};

restoreWorkbookController.api = {
    summary: 'Restore workbook',
    tags: [ApiTag.Workbooks],
    request: {
        params: requestSchema.params,
    },
    responses: {
        200: {
            description: WorkbookIdModel.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: WorkbookIdModel.schema,
                },
            },
        },
    },
};
