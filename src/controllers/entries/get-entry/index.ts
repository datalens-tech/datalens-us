import {Request, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../../components/api-docs';
import {makeReqParser, z, zc} from '../../../components/zod';
import {CONTENT_TYPE_JSON} from '../../../const';
import {getEntryV2} from '../../../services/new/entry';

import {getEntryResult} from './response-model';

const requestSchema = {
    params: z.object({
        entryId: z.string(),
    }),
    query: z.object({
        branch: z.enum(['saved', 'published']).optional(),
        revId: z.string().optional(),
        includePermissionsInfo: zc.stringBoolean().optional(),
        includeLinks: zc.stringBoolean().optional(),
        includeServicePlan: zc.stringBoolean().optional(),
        includeTenantFeatures: zc.stringBoolean().optional(),
        includeFavorite: zc.stringBoolean().optional(),
        includeTenantSettings: zc.stringBoolean().optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getEntryController = async (req: Request, res: Response) => {
    const {query, params} = await parseReq(req);

    const result = await getEntryV2(
        {ctx: req.ctx},
        {
            entryId: params.entryId,
            branch: query.branch,
            revId: query.revId,
            includePermissionsInfo: query.includePermissionsInfo,
            includeLinks: query.includeLinks,
            includeServicePlan: query.includeServicePlan,
            includeTenantFeatures: query.includeTenantFeatures,
            includeFavorite: query.includeFavorite,
            includeTenantSettings: query.includeTenantSettings,
        },
    );

    res.status(200).send(getEntryResult.format(req.ctx, result));
};

getEntryController.api = {
    summary: 'Get entry',
    tags: [ApiTag.Entries],
    request: {
        params: requestSchema.params,
        query: requestSchema.query,
    },
    responses: {
        200: {
            description: getEntryResult.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: getEntryResult.schema,
                },
            },
        },
    },
};
