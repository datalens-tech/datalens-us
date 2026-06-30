import {withContract} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {z, zc} from '../../components/zod';
import {LogEventType} from '../../registry/plugins/common/utils/log-event/types';
import {renameEntry} from '../../services/entry';

import {renameEntryModel} from './response-models/rename-entry-model';

export const renameEntryController = withContract({
    operationId: 'renameEntry',
    summary: 'Rename entry',
    tags: [ApiTag.Entries],
    request: {
        params: z.object({
            entryId: zc.encodedId(),
        }),
        body: z.object({
            name: zc.entityName(),
        }),
    },
    response: {
        content: {
            200: {
                schema: renameEntryModel.schema,
                description: renameEntryModel.schema.description,
            },
        },
    },
})(async (req, res) => {
    const {params, body} = req;

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    const logEventReqParams = {entryId: params.entryId, name: body.name};

    try {
        const result = await renameEntry(req.ctx, {entryId: params.entryId, name: body.name});

        await logEvent({
            type: LogEventType.RenameEntrySuccess,
            ctx: req.ctx,
            data: result,
            reqParams: logEventReqParams,
        });

        res.sendTyped(200, await renameEntryModel.format(result));
    } catch (error) {
        await logEvent({
            type: LogEventType.RenameEntryFail,
            ctx: req.ctx,
            reqParams: logEventReqParams,
            error,
        });

        throw error;
    }
});

renameEntryController.manualDecodeId = true;
