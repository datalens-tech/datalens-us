import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {prepareResponseAsync} from '../../components/response-presenter';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {restoreWorkbook} from '../../services/new/workbook';
import {formatRestoreWorkbook} from '../../services/new/workbook/formatters';

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

    const formattedResponse = formatRestoreWorkbook(result);
    const {code, response} = await prepareResponseAsync({data: formattedResponse});
    res.status(code).send(response);
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
