import {withContract} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {z, zc} from '../../components/zod';
import {LogEventType} from '../../registry/plugins/common/utils/log-event/types';
import {copyEntryToWorkbook} from '../../services/new/entry';

import {copyEntryToWorkbookModel} from './response-models/copy-entry-to-workbook-model';

export const copyEntryToWorkbookController = withContract({
    operationId: 'copyEntryToWorkbook',
    summary: 'Copy entry to workbook',
    tags: [ApiTag.Entries],
    request: {
        params: z.object({
            entryId: zc.encodedId(),
        }),
        body: z.object({
            workbookId: zc.encodedId().optional(),
            name: zc.entityName().optional(),
        }),
    },
    response: {
        content: {
            200: {
                schema: copyEntryToWorkbookModel.schema,
                description: copyEntryToWorkbookModel.schema.description,
            },
        },
    },
})(async (req, res) => {
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

        await logEvent({
            type: LogEventType.CopyEntryToWorkbookSuccess,
            ctx: req.ctx,
            entry: result,
            reqParams: logEventReqParams,
        });

        res.sendTyped(200, copyEntryToWorkbookModel.format(result));
    } catch (error) {
        await logEvent({
            type: LogEventType.CopyEntryToWorkbookFail,
            ctx: req.ctx,
            reqParams: logEventReqParams,
            error,
        });

        throw error;
    }
});

copyEntryToWorkbookController.manualDecodeId = true;
