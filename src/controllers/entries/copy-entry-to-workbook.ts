import {AppRouteHandler} from '@gravity-ui/expresskit';

import {prepareResponseAsync} from '../../components/response-presenter';
import {LogEventType} from '../../registry/common/utils/log-event/types';
import {copyEntryToWorkbook} from '../../services/new/entry';
import {formatEntryModel} from '../../services/new/entry/formatters';

export const copyEntryToWorkbookController: AppRouteHandler = async (req, res) => {
    const {params, body} = req;

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    const logEventReqParams = {entryId: params.entryId, workbookId: body.workbookId};

    try {
        const result = await copyEntryToWorkbook(
            {ctx: req.ctx},
            {
                entryId: params.entryId,
                workbookId: body.workbookId,
                name: body.name,
            },
        );

        logEvent({
            type: LogEventType.CopyEntryToWorkbookSuccess,
            ctx: req.ctx,
            entry: result,
            reqParams: logEventReqParams,
        });

        const formattedResponse = formatEntryModel(result);

        const {code, response} = await prepareResponseAsync({data: formattedResponse});
        res.status(code).send(response);
    } catch (error) {
        logEvent({
            type: LogEventType.CopyEntryToWorkbookFail,
            ctx: req.ctx,
            reqParams: logEventReqParams,
            error,
        });

        throw error;
    }
};
