import {AppRouteHandler} from '@gravity-ui/expresskit';

import {prepareResponseAsync} from '../../components/response-presenter';
import {LogEventType} from '../../registry/plugins/common/utils/log-event/types';
import EntryService from '../../services/entry.service';
import {isTrueArg} from '../../utils/env-utils';

export const createEntryController: AppRouteHandler = async (req, res) => {
    const {body} = req;

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    const logEventReqParams = {
        workbookId: body.workbookId,
        collectionId: body.collectionId,
        name: body.name,
        scope: body.scope,
        type: body.type,
        key: body.key,
        recursion: body.recursion,
    };

    try {
        const result = await EntryService.create({
            workbookId: body.workbookId,
            collectionId: body.collectionId,
            name: body.name,
            scope: body.scope,
            type: body.type,
            key: body.key,
            meta: body.meta,
            description: body.description,
            annotation: body.annotation,
            recursion: body.recursion,
            hidden: body.hidden,
            mirrored: body.mirrored,
            mode: body.mode,
            data: body.data,
            unversionedData: body.unversionedData,
            links: body.links,
            permissionsMode: body.permissionsMode,
            includePermissionsInfo: isTrueArg(body.includePermissionsInfo),
            initialPermissions: body.initialPermissions,
            initialParentId: body.initialParentId,
            checkServicePlan: body.checkServicePlan,
            checkTenantFeatures: body.checkTenantFeatures,
            version: body.version,
            sourceVersion: body.sourceVersion,
            ctx: req.ctx,
        });

        logEvent({
            type: LogEventType.CreateEntrySuccess,
            ctx: req.ctx,
            data: result,
            reqParams: logEventReqParams,
        });

        const {code, response} = await prepareResponseAsync({data: result});

        res.status(code).send(response);
    } catch (error) {
        logEvent({
            type: LogEventType.CreateEntryFail,
            ctx: req.ctx,
            reqParams: logEventReqParams,
            error,
        });

        throw error;
    }
};
