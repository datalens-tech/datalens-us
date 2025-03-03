import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {LogEventType} from '../../registry/common/utils/log-event/types';
import {deleteWorkbooks} from '../../services/new/workbook';

import {WorkbookResponseModel, workbookModel} from './response-models';

const requestSchema = {
    params: z.object({
        workbookId: zc.encodedId(),
    }),
};

export type DeleteWorkbookReqParams = z.infer<typeof requestSchema.params>;

const parseReq = makeReqParser(requestSchema);

export const deleteWorkbookController: AppRouteHandler = async (
    req,
    res: Response<WorkbookResponseModel>,
) => {
    const {params} = await parseReq(req);

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    try {
        const result = await deleteWorkbooks(
            {
                ctx: req.ctx,
            },
            {
                workbookIds: [params.workbookId],
            },
        );

        logEvent({
            type: LogEventType.DeleteWorkbookSuccess,
            ctx: req.ctx,
            reqParams: params,
            workbooks: result.workbooks,
        });

        res.status(200).send(workbookModel.format(result.workbooks[0]));
    } catch (error) {
        logEvent({
            type: LogEventType.DeleteWorkbookFail,
            ctx: req.ctx,
            reqParams: params,
            error,
        });

        throw error;
    }
};

deleteWorkbookController.api = {
    summary: 'Delete workbook',
    tags: [ApiTag.Workbooks],
    request: {
        params: requestSchema.params,
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

deleteWorkbookController.manualDecodeId = true;
