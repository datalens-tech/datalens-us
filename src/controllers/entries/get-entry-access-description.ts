import {withContract} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {z, zc} from '../../components/zod';
import {getEntryAccessDescription} from '../../services/new/entry';

import {entryAccessDescriptionModel} from './response-models';

export const getEntryAccessDescriptionController = withContract({
    operationId: 'getEntryAccessDescription',
    summary: 'Get access description for Entry',
    tags: [ApiTag.Entries],
    request: {
        params: z.object({
            entryId: zc.encodedId(),
        }),
        query: z.object({
            branch: z.enum(['saved', 'published']).optional(),
        }),
    },
    response: {
        content: {
            200: {
                schema: entryAccessDescriptionModel.schema,
                description: entryAccessDescriptionModel.schema.description,
            },
        },
    },
})(async (req, res) => {
    const result = await getEntryAccessDescription(
        {ctx: req.ctx},
        {
            entryId: req.params.entryId,
            branch: req.query.branch,
        },
    );

    res.sendTyped(200, entryAccessDescriptionModel.format(result));
});

getEntryAccessDescriptionController.manualDecodeId = true;
