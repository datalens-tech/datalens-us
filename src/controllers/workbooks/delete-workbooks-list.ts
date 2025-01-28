import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {LogEventType} from '../../registry/common/utils/log-event/types';
import {deleteWorkbooks} from '../../services/new/workbook';

import {
    WorkbookModelArrayInObjectResponseModel,
    workbookModelArrayInObject,
} from './response-models';

const requestSchema = {
    body: z.object({
        workbookIds: zc.encodedIdArray({min: 1, max: 1000}),
    }),
};

export type DeleteWorkbooksListReqBody = z.infer<typeof requestSchema.body>;

const parseReq = makeReqParser(requestSchema);

const controller: AppRouteHandler = async (
    req,
    res: Response<WorkbookModelArrayInObjectResponseModel>,
) => {
    const {body} = await parseReq(req);

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    try {
        const result = await deleteWorkbooks(
            {
                ctx: req.ctx,
            },
            {
                workbookIds: body.workbookIds,
            },
        );

        logEvent({
            type: LogEventType.DeleteWorkbooksListSuccess,
            ctx: req.ctx,
            reqBody: body,
            workbooks: result.workbooks,
        });

        res.status(200).send(await workbookModelArrayInObject.format(result));
    } catch (error) {
        logEvent({
            type: LogEventType.DeleteWorkbooksListFail,
            ctx: req.ctx,
            reqBody: body,
            error,
        });

        throw error;
    }
};

controller.api = {
    summary: 'Delete workbooks list',
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

export {controller as deleteWorkbooksList};
