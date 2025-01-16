import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {updateWorkbook} from '../../services/new/workbook';

import {workbookModel} from './response-models';

const requestSchema = {
    params: z.object({
        workbookId: zc.encodedId(),
    }),
    body: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

const controller: AppRouteHandler = async (req, res) => {
    const {body, params} = await parseReq(req);

    const result = await updateWorkbook(
        {
            ctx: req.ctx,
        },
        {
            workbookId: params.workbookId,
            title: body.title,
            description: body.description,
        },
    );

    res.status(200).send(workbookModel.format(result));
};

controller.api = {
    summary: 'Update workbook',
    tags: [ApiTag.Workbooks],
    request: {
        params: requestSchema.params,
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

export {controller as updateWorkbook};
