import {AppRouteHandler} from '@gravity-ui/expresskit';

import {prepareResponseAsync} from '../../components/response-presenter';
import {makeReqParser, z, zc} from '../../components/zod';
import {LogEventType} from '../../registry/common/utils/log-event/types';
import {deleteEntry} from '../../services/entry';

const requestSchema = {
    params: z.object({
        entryId: zc.encodedId(),
    }),
    query: z.object({
        lockToken: z.string().optional(),
    }),
};

export type DeleteEntryReqParams = z.infer<typeof requestSchema.params>;
export type DeleteEntryReqQuery = z.infer<typeof requestSchema.query>;

const parseReq = makeReqParser(requestSchema);

const controller: AppRouteHandler = async (req, res) => {
    const {query, params} = await parseReq(req);

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    try {
        const result = await deleteEntry(
            {ctx: req.ctx, skipValidation: true},
            {
                entryId: params.entryId,
                lockToken: query.lockToken,
            },
        );

        logEvent({
            type: LogEventType.DeleteEntrySuccess,
            ctx: req.ctx,
            reqParams: params,
            reqQuery: query,
            entry: result,
        });

        const {code, response} = await prepareResponseAsync({data: result});
        res.status(code).send(response);
    } catch (error) {
        logEvent({
            type: LogEventType.DeleteEntryFail,
            ctx: req.ctx,
            reqParams: params,
            reqQuery: query,
            error,
        });

        throw error;
    }
};

controller.manualDecodeId = true;

export {controller as deleteEntry};
