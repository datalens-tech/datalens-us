import {AppRouteHandler} from '@gravity-ui/expresskit';

import {prepareResponseAsync} from '../../components/response-presenter';
import {LogEventType} from '../../registry/common/utils/log-event/types';
import {updateEntry} from '../../services/entry';

export const updateEntryController: AppRouteHandler = async (req, res) => {
    const {params, body} = req;

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    const logEventReqParams = {entryId: params.entryId, name: body.name};

    try {
        const result = await updateEntry(req.ctx, {
            entryId: params.entryId,
            meta: body.meta,
            data: body.data,
            unversionedData: body.unversionedData,
            links: body.links,
            mode: body.mode,
            type: body.type,
            hidden: body.hidden,
            mirrored: body.mirrored,
            revId: body.revId,
            lockToken: body.lockToken,
            skipSyncLinks: body.skipSyncLinks,
            updateRevision: body.updateRevision,
            checkServicePlan: body.checkServicePlan,
            checkTenantFeatures: body.checkTenantFeatures,
        });

        logEvent({
            type: LogEventType.UpdateEntrySuccess,
            ctx: req.ctx,
            data: result,
            reqParams: logEventReqParams,
        });

        const {code, response} = await prepareResponseAsync({data: result});

        res.status(code).send(response);
    } catch (error) {
        logEvent({
            type: LogEventType.UpdateEntryFail,
            ctx: req.ctx,
            reqParams: logEventReqParams,
            error,
        });

        throw error;
    }
};
