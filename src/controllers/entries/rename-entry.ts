import {AppRouteHandler} from '@gravity-ui/expresskit';

import {prepareResponseAsync} from '../../components/response-presenter';
import {LogEventType} from '../../registry/common/utils/log-event/types';
import {renameEntry} from '../../services/entry';

export const renameEntryController: AppRouteHandler = async (req, res) => {
    const {params, body} = req;

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    const logEventReqParams = {entryId: params.entryId, name: body.name};

    try {
        const result = await renameEntry(req.ctx, {
            entryId: params.entryId,
            name: body.name,
        });

        logEvent({
            type: LogEventType.RenameEntrySuccess,
            ctx: req.ctx,
            data: result,
            reqParams: logEventReqParams,
        });

        const {code, response} = await prepareResponseAsync({data: result});

        res.status(code).send(response);
    } catch (error) {
        logEvent({
            type: LogEventType.RenameEntryFail,
            ctx: req.ctx,
            reqParams: logEventReqParams,
            error,
        });

        throw error;
    }
};
