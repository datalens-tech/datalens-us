import {withContract} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {z, zc} from '../../components/zod';
import {EntryScope} from '../../db/models/new/entry/types';
import {LogEventType} from '../../registry/plugins/common/utils/log-event/types';
import {deleteEntry} from '../../services/entry';

import {deleteEntryModel} from './response-models/delete-entry-model';

const requestSchema = {
    params: z.object({
        entryId: zc.encodedId(),
    }),
    query: z.object({
        lockToken: z.string().optional(),
        scope: z.enum(EntryScope).optional(),
        types: zc.queryArray({min: 1, max: 100}).optional(),
    }),
};

export type DeleteEntryReqParams = z.infer<typeof requestSchema.params>;

export const deleteEntryController = withContract({
    operationId: 'deleteEntry',
    summary: 'Delete entry',
    tags: [ApiTag.Entries],
    request: {
        params: requestSchema.params,
        query: requestSchema.query,
    },
    response: {
        content: {
            200: {
                schema: deleteEntryModel.schema,
                description: deleteEntryModel.schema.description,
            },
        },
    },
})(async (req, res) => {
    const {entryId} = req.params;
    const {lockToken, scope, types} = req.query;

    const registry = req.ctx.get('registry');
    const {logEvent} = registry.common.functions.get();

    try {
        const result = await deleteEntry(
            {ctx: req.ctx, skipValidation: true, checkLicense: true},
            {entryId, lockToken, scope, types},
        );

        await logEvent({
            type: LogEventType.DeleteEntrySuccess,
            ctx: req.ctx,
            reqParams: req.params,
            entry: result,
        });

        res.sendTyped(200, deleteEntryModel.format(result));
    } catch (error) {
        await logEvent({
            type: LogEventType.DeleteEntryFail,
            ctx: req.ctx,
            reqParams: req.params,
            error,
        });

        throw error;
    }
});

deleteEntryController.manualDecodeId = true;
