import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {getEntryMeta} from '../../services/new/entry';

import {entryMetaModel} from './response-models';

const requestSchema = {
    params: z.object({
        entryId: zc.encodedId(),
    }),
    query: z.object({
        branch: z.enum(['saved', 'published']).optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getEntryMetaController: AppRouteHandler = async (req, res) => {
    const {params, query} = await parseReq(req);

    const result = await getEntryMeta(
        {ctx: req.ctx},
        {
            entryId: params.entryId,
            branch: query.branch,
        },
    );

    const formattedResponse = entryMetaModel.format(result);

    res.status(200).send(formattedResponse);
};

getEntryMetaController.api = {
    summary: 'Get meta for Entry',
    tags: [ApiTag.Entries],
    request: {
        params: requestSchema.params,
        query: requestSchema.query,
    },
    responses: {
        200: {
            description: `${entryMetaModel.schema.description}`,
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: entryMetaModel.schema,
                },
            },
        },
    },
};

getEntryMetaController.manualDecodeId = true;
