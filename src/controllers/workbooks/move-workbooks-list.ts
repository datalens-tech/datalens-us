import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {moveWorkbooksList} from '../../services/new/workbook';

import {
    WorkbookModelArrayInObjectResponseModel,
    workbookModelArrayInObject,
} from './response-models';

const requestSchema = {
    body: z.object({
        workbookIds: zc.encodedIdArray({min: 1, max: 1000}),
        collectionId: zc.encodedId().nullable(),
    }),
};

const parseReq = makeReqParser(requestSchema);

const controller: AppRouteHandler = async (
    req,
    res: Response<WorkbookModelArrayInObjectResponseModel>,
) => {
    const {body} = await parseReq(req);

    const result = await moveWorkbooksList(
        {
            ctx: req.ctx,
        },
        {
            workbookIds: body.workbookIds,
            collectionId: body.collectionId,
        },
    );

    res.status(200).send(await workbookModelArrayInObject.format(result));
};

controller.api = {
    summary: 'Move workbooks list',
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
            description: workbookModelArrayInObject.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: workbookModelArrayInObject.schema,
                },
            },
        },
    },
};

controller.manualDecodeId = true;

export {controller as moveWorkbooksList};
