import {AppRouteHandler} from '@gravity-ui/expresskit';

import {prepareResponseAsync} from '../../components/response-presenter';
import {makeReqParser, z, zc} from '../../components/zod';
import {LogEventType} from '../../registry/common/utils/log-event/types';
import {copyEntriesToWorkbook} from '../../services/new/entry';

const requestSchema = {
    body: z.object({
        entryIds: zc.encodedIdArray({min: 1, max: 1000}),
        workbookId: zc.encodedId(),
    }),
};

export type CopyEntriesToWorkbookReqBody = z.infer<typeof requestSchema.body>;

const parseReq = makeReqParser(requestSchema);

export const copyEntriesToWorkbookController: AppRouteHandler = async (req, res) => {
    const {body} = await parseReq(req);

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    try {
        const result = await copyEntriesToWorkbook(
            {ctx: req.ctx},
            {
                entryIds: body.entryIds,
                workbookId: body.workbookId,
            },
        );

        logEvent({
            type: LogEventType.CopyEntriesToWorkbookSuccess,
            ctx: req.ctx,
            reqBody: body,
            data: result,
        });

        const {code, response} = await prepareResponseAsync({data: result});

        res.status(code).send(response);
    } catch (error) {
        logEvent({
            type: LogEventType.CopyEntriesToWorkbookFail,
            ctx: req.ctx,
            reqBody: body,
            error,
        });

        throw error;
    }
};

copyEntriesToWorkbookController.manualDecodeId = true;
