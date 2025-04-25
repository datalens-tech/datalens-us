import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {restoreWorkbook} from '../../services/new/workbook';

import {WorkbookIdModel, workbookIdModel} from './response-models';

const requestSchema = {
    params: z.object({
        workbookId: zc.encodedId(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const restoreWorkbookController: AppRouteHandler = async (
    req,
    res: Response<WorkbookIdModel>,
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

    res.status(200).send(workbookIdModel.format(result));
};

restoreWorkbookController.api = {
    summary: 'Restore workbook',
    tags: [ApiTag.Workbooks],
    request: {
        params: requestSchema.params,
    },
    responses: {
        200: {
            description: `${workbookIdModel.schema.description}`,
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: workbookIdModel.schema,
                },
            },
        },
    },
};

restoreWorkbookController.manualDecodeId = true;
