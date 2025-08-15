import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {LogEventType} from '../../registry/common/utils/log-event/types';
import {moveWorkbook} from '../../services/new/workbook';

import {WorkbookResponseModel, workbookModel} from './response-models';

const requestSchema = {
    params: z.object({
        workbookId: zc.encodedId(),
    }),
    body: z.object({
        collectionId: zc.encodedId().nullable(),
        title: zc.entityName().optional(),
    }),
};

export type MoveWorkbookReqParams = z.infer<typeof requestSchema.params>;

export type MoveWorkbookReqBody = z.infer<typeof requestSchema.body>;

const parseReq = makeReqParser(requestSchema);

export const moveWorkbookController: AppRouteHandler = async (
    req,
    res: Response<WorkbookResponseModel>,
) => {
    const {params, body} = await parseReq(req);

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    try {
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

        logEvent({
            type: LogEventType.MoveWorkbookSuccess,
            ctx: req.ctx,
            reqBody: body,
            reqParams: params,
            workbook: result,
        });

        res.status(200).send(workbookModel.format(result));
    } catch (error) {
        logEvent({
            type: LogEventType.MoveWorkbookFail,
            ctx: req.ctx,
            reqBody: body,
            reqParams: params,
            error,
        });

        throw error;
    }
};

moveWorkbookController.api = {
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

moveWorkbookController.manualDecodeId = true;
