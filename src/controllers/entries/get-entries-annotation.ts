import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {EntryScope} from '../../db/models/new/entry/types';
import {getJoinedEntriesRevisionsByIds} from '../../services/new/entry';

import {entriesAnnotationModel} from './response-models';

const requestSchema = {
    body: z.object({
        entryIds: zc.encodedIdArray({min: 1, max: 1000}),
        scope: z.nativeEnum(EntryScope).optional(),
        type: z.string().optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getEntriesAnnotationController: AppRouteHandler = async (req, res) => {
    const {body} = await parseReq(req);

    const result = await getJoinedEntriesRevisionsByIds(
        {ctx: req.ctx},
        {
            entryIds: body.entryIds,
            scope: body.scope,
            type: body.type,
        },
    );

    const response = entriesAnnotationModel.format({
        result,
        entryIds: body.entryIds,
    });

    res.status(200).send(response);
};

getEntriesAnnotationController.api = {
    summary: 'Get entries annotation',
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
            description: `${entriesAnnotationModel.schema.description}`,
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: entriesAnnotationModel.schema,
                },
            },
        },
    },
};

getEntriesAnnotationController.manualDecodeId = true;
