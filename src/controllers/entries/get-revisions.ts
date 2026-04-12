import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {getEntryRevisions} from '../../services/entry';

import {entryRevisionsPageModel} from './response-models/entry-revisions-page-model';

const requestSchema = {
    params: z.object({
        entryId: zc.encodedId(),
    }),
    query: z.object({
        page: zc.stringNumber({min: 0}).optional(),
        pageSize: zc.stringNumber({min: 1, max: 200}).optional(),
        revIds: z
            .union([zc.encodedId().transform((id) => [id]), zc.encodedIdArray({min: 0, max: 1000})])
            .optional(),
        updatedAfter: z.string().optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getRevisionsController: AppRouteHandler = async (req, res) => {
    const {params, query} = await parseReq(req);

    const result = await getEntryRevisions(
        {ctx: req.ctx},
        {
            entryId: params.entryId,
            page: query.page,
            pageSize: query.pageSize,
            revIds: query.revIds,
            updatedAfter: query.updatedAfter,
        },
    );

    res.status(200).send(await entryRevisionsPageModel.format(result));
};

getRevisionsController.api = {
    summary: 'Get entry revisions',
    tags: [ApiTag.Entries],
    request: {
        params: requestSchema.params,
        query: requestSchema.query,
    },
    responses: {
        200: {
            description: entryRevisionsPageModel.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: entryRevisionsPageModel.schema,
                },
            },
        },
    },
};

getRevisionsController.manualDecodeId = true;
