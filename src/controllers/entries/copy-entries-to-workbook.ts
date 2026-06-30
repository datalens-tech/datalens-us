import {withContract} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {z, zc} from '../../components/zod';
import {LogEventType} from '../../registry/plugins/common/utils/log-event/types';
import {copyEntriesToWorkbook} from '../../services/new/entry';
import {workbookIdModel} from '../response-models';

const requestSchema = {
    body: z.object({
        entryIds: zc.encodedIdArray({min: 1, max: 1000}),
        workbookId: zc.encodedId(),
    }),
};

export type CopyEntriesToWorkbookReqBody = z.infer<typeof requestSchema.body>;

export const copyEntriesToWorkbookController = withContract({
    operationId: 'copyEntriesToWorkbook',
    summary: 'Copy entries to workbook',
    tags: [ApiTag.Entries],
    request: {
        body: requestSchema.body,
    },
    response: {
        content: {
            200: {
                schema: workbookIdModel.schema,
                description: workbookIdModel.schema.description,
            },
        },
    },
})(async (req, res) => {
    const {entryIds, workbookId} = req.body;

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    try {
        const result = await copyEntriesToWorkbook({ctx: req.ctx}, {entryIds, workbookId});

        await logEvent({
            type: LogEventType.CopyEntriesToWorkbookSuccess,
            ctx: req.ctx,
            reqBody: req.body,
            data: result,
        });

        res.sendTyped(200, workbookIdModel.format(result));
    } catch (error) {
        await logEvent({
            type: LogEventType.CopyEntriesToWorkbookFail,
            ctx: req.ctx,
            reqBody: req.body,
            error,
        });

        throw error;
    }
});

copyEntriesToWorkbookController.manualDecodeId = true;
