import {withContract} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {z, zc} from '../../components/zod';
import {EntryScope} from '../../db/models/new/entry/types';
import {getEntriesRelations} from '../../services/new/entry';
import {LinkDirection} from '../../services/new/entry/get-entries-relations/types';

import {getEntriesRelationsResult} from './response-models/get-entries-relations-model';

export const getEntriesRelationsController = withContract({
    operationId: 'getEntriesRelations',
    summary: 'Get entries relations',
    tags: [ApiTag.Entries],
    request: {
        body: z.object({
            entryIds: zc.encodedIdArray({min: 1, max: 1000}),
            linkDirection: z.enum(LinkDirection).optional(),
            includePermissionsInfo: z.boolean().optional(),
            limit: z.number().min(1).max(1000).optional(),
            pageToken: z.string().optional(),
            scope: z.enum(EntryScope).optional(),
        }),
    },
    response: {
        content: {
            200: {
                schema: getEntriesRelationsResult.schema,
                description: getEntriesRelationsResult.schema.description,
            },
        },
    },
})(async (req, res) => {
    const {entryIds, linkDirection, includePermissionsInfo, limit, pageToken, scope} = req.body;

    const result = await getEntriesRelations(
        {ctx: req.ctx},
        {entryIds, linkDirection, includePermissionsInfo, limit, pageToken, scope},
    );

    res.sendTyped(200, await getEntriesRelationsResult.format(result));
});

getEntriesRelationsController.manualDecodeId = true;
