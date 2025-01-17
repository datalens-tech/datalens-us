import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {createWorkbook} from '../../services/new/workbook';

import {
    WorkbookInstanceWithOperationResponseModel,
    workbookInstanceWithOperation,
} from './response-models';

const requestSchema = {
    body: z.object({
        collectionId: zc.encodedId().optional().nullable(),
        title: z.string(),
        description: z.string().optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

const controller: AppRouteHandler = async (
    req,
    res: Response<WorkbookInstanceWithOperationResponseModel>,
) => {
    const {body} = await parseReq(req);

    const result = await createWorkbook(
        {
            ctx: req.ctx,
        },
        {
            collectionId: body.collectionId ?? null,
            title: body.title,
            description: body.description,
        },
    );

    res.status(200).send(workbookInstanceWithOperation.format(result.workbook, result.operation));
};

controller.api = {
    summary: 'Create workbook',
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
            description: workbookInstanceWithOperation.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: workbookInstanceWithOperation.schema.omit({permissions: true}),
                },
            },
        },
    },
};

controller.manualDecodeId = true;

export {controller as createWorkbook};
