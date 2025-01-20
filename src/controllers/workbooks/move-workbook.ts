import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {moveWorkbook} from '../../services/new/workbook';

import {WorkbookResponseModel, workbookModel} from './response-models';

const requestSchema = {
    params: z.object({
        workbookId: zc.encodedId(),
    }),
    body: z.object({
        collectionId: zc.encodedId().nullable(),
        title: z.string().optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

const controller: AppRouteHandler = async (req, res: Response<WorkbookResponseModel>) => {
    const {params, body} = await parseReq(req);

    const result = await moveWorkbook(
        {
            ctx: req.ctx,
            skipValidation: true,
        },
        {
            workbookId: params.workbookId,
            collectionId: body.collectionId,
            title: body.title,
        },
    );

    res.status(200).send(workbookModel.format(result));
};

controller.api = {
    summary: 'Move workbook',
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

export {controller as moveWorkbook};
