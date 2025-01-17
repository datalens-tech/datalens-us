import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {copyWorkbook} from '../../services/new/workbook';

import {
    WorkbookModelWithOperationResponseModel,
    workbookModelWithOperation,
} from './response-models';

const requestSchema = {
    params: z.object({
        workbookId: zc.encodedId(),
    }),
    body: z
        .object({
            collectionId: zc.encodedId().optional().nullable(),
        })
        .and(z.union([z.object({title: z.string()}), z.object({newTitle: z.string()})])),
};

const parseReq = makeReqParser(requestSchema);

const controller: AppRouteHandler = async (
    req,
    res: Response<WorkbookModelWithOperationResponseModel>,
) => {
    const {params, body} = await parseReq(req);

    const result = await copyWorkbook(
        {
            ctx: req.ctx,
        },
        {
            workbookId: params.workbookId,
            collectionId: body.collectionId ?? null,
            // newTitle for compatibility
            title: 'title' in body ? body.title : body.newTitle,
        },
    );

    res.status(200).send(workbookModelWithOperation.format(result.workbook, result.operation));
};

controller.api = {
    summary: 'Copy workbook',
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
            description: workbookModelWithOperation.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: workbookModelWithOperation.schema,
                },
            },
        },
    },
};

controller.manualDecodeId = true;

export {controller as copyWorkbook};
