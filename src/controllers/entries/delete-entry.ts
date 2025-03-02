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

const parseReq = makeReqParser(requestSchema);

export const deleteEntryController: AppRouteHandler = async (req, res) => {
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
            entry: result,
        });

        const {code, response} = await prepareResponseAsync({data: result});
        res.status(code).send(response);
    } catch (error) {
        logEvent({
            type: LogEventType.DeleteEntryFail,
            ctx: req.ctx,
            reqParams: params,
            error,
        });

        throw error;
    }
};

deleteEntryController.manualDecodeId = true;
