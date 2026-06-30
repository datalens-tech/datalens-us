import {withContract} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {z, zc} from '../../components/zod';
import {getEntry} from '../../services/new/entry';

import {getEntryResult} from './response-models/get-entry-model';

export const getEntryController = withContract({
    operationId: 'getEntry',
    summary: 'Get entry',
    tags: [ApiTag.Entries],
    request: {
        params: z.object({
            entryId: zc.encodedId(),
        }),
        query: z.object({
            branch: z.enum(['saved', 'published']).optional(),
            revId: zc.encodedId().optional(),
            includePermissionsInfo: zc.stringBoolean().optional(),
            includeLinks: zc.stringBoolean().optional(),
            includeServicePlan: zc.stringBoolean().optional(),
            includeTenantFeatures: zc.stringBoolean().optional(),
            includeFavorite: zc.stringBoolean().optional(),
            includeTenantSettings: zc.stringBoolean().optional(),
        }),
    },
    response: {
        content: {
            200: {
                schema: getEntryResult.schema,
                description: getEntryResult.schema.description,
            },
        },
    },
})(async (req, res) => {
    const {entryId} = req.params;
    const {
        branch,
        revId,
        includePermissionsInfo,
        includeLinks,
        includeServicePlan,
        includeTenantFeatures,
        includeFavorite,
        includeTenantSettings,
    } = req.query;

    const result = await getEntry(
        {ctx: req.ctx},
        {
            entryId,
            branch,
            revId,
            includePermissionsInfo,
            includeLinks,
            includeServicePlan,
            includeTenantFeatures,
            includeFavorite,
            includeTenantSettings,
        },
    );

    res.sendTyped(200, getEntryResult.format(req.ctx, result));
});

getEntryController.manualDecodeId = true;
