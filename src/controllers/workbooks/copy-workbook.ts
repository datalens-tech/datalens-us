import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {LogEventType} from '../../registry/common/utils/log-event/types';
import {copyWorkbook} from '../../services/new/workbook';

import {
    WorkbookModelWithOperationResponseModel,
    workbookModelWithOperation,
} from './response-models';

const requestSchema = {
    params: z.object({
        workbookId: zc.encodedId(),
    }),
    body: z.object({
        collectionId: zc.encodedId().optional().nullable(),
        title: z.string(),
    }),
};

export type CopyWorkbookReqParams = z.infer<typeof requestSchema.params>;

export type CopyWorkbookReqBody = z.infer<typeof requestSchema.body>;

const parseReq = makeReqParser(requestSchema);

export const copyWorkbookController: AppRouteHandler = async (
    req,
    res: Response<WorkbookModelWithOperationResponseModel>,
) => {
    const {params, body} = await parseReq(req);

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    try {
        const result = await copyWorkbook(
            {
                ctx: req.ctx,
            },
            {
                workbookId: params.workbookId,
                collectionId: body.collectionId ?? null,
                title: body.title,
            },
        );

        logEvent({
            type: LogEventType.CopyWorkbookSuccess,
            ctx: req.ctx,
            reqBody: body,
            reqParams: params,
            workbook: result.workbook,
        });

        res.status(200).send(workbookModelWithOperation.format(result.workbook, result.operation));
    } catch (error) {
        logEvent({
            type: LogEventType.CopyWorkbookFail,
            ctx: req.ctx,
            reqBody: body,
            reqParams: params,
            error,
        });

        throw error;
    }
};

copyWorkbookController.api = {
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

copyWorkbookController.manualDecodeId = true;
