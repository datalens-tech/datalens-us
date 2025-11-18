import {Request, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../../components/api-docs';
import {makeReqParser, z, zc} from '../../../components/zod';
import {CONTENT_TYPE_JSON} from '../../../const';
import {EntryScope} from '../../../db/models/new/entry/types';
import {getEntriesRelations} from '../../../services/new/entry';
import {SearchDirection} from '../../../services/new/entry/get-entries-relations/types';

import {getEntriesRelationsResult} from './response-model';

const requestSchema = {
    body: z.object({
        entryIds: zc.encodedIdArray({min: 1, max: 1000}),
        searchDirection: z.nativeEnum(SearchDirection).optional(),
        includePermissionsInfo: z.boolean().optional(),
        limit: z.number().min(1).max(1000).optional(),
        pageToken: z.string().optional(),
        scope: z.nativeEnum(EntryScope).optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getEntriesRelationsController = async (req: Request, res: Response) => {
    const {body} = await parseReq(req);

    const result = await getEntriesRelations(
        {ctx: req.ctx},
        {
            entryIds: body.entryIds,
            searchDirection: body.searchDirection,
            includePermissionsInfo: body.includePermissionsInfo,
            limit: body.limit,
            pageToken: body.pageToken,
            scope: body.scope,
        },
    );

    res.status(200).send(await getEntriesRelationsResult.format(result));
};

getEntriesRelationsController.api = {
    summary: 'Get entries relations',
    tags: [ApiTag.Entries],
    request: {
        body: {
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: requestSchema.body,
                },
            },
        },
    },
    responses: {
        200: {
            description: getEntriesRelationsResult.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: getEntriesRelationsResult.schema,
                },
            },
        },
    },
};

getEntriesRelationsController.manualDecodeId = true;
