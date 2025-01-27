import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {LogEventType} from '../../registry/common/utils/log-event/types';
import {updateWorkbook} from '../../services/new/workbook';

import {WorkbookResponseModel, workbookModel} from './response-models';

const requestSchema = {
    params: z.object({
        workbookId: zc.encodedId(),
    }),
    body: z
        .object({
            title: z.string().optional(),
            description: z.string().optional(),
        })
        .refine(
            ({title, description}) => {
                return typeof title === 'string' || typeof description === 'string';
            },
            {
                message: `The request body must contain either "title" or "description".`,
            },
        ),
};

export type UpdateWorkbookReqParams = z.infer<typeof requestSchema.params>;

export type UpdateWorkbookReqBody = z.infer<typeof requestSchema.body>;

const parseReq = makeReqParser(requestSchema);

const controller: AppRouteHandler = async (req, res: Response<WorkbookResponseModel>) => {
    const {body, params} = await parseReq(req);

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    try {
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

        logEvent({
            type: LogEventType.UpdateWorkbookSuccess,
            ctx: req.ctx,
            reqBody: body,
            reqParams: params,
            workbook: result,
        });

        res.status(200).send(workbookModel.format(result));
    } catch (error) {
        logEvent({
            type: LogEventType.UpdateWorkbookFail,
            ctx: req.ctx,
            reqBody: body,
            reqParams: params,
            error,
        });

        throw error;
    }
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
