import {AppRouteHandler, Request, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {EntryScope} from '../../db/models/new/entry/types';
import {getJoinedEntriesRevisionsByIds} from '../../services/new/entry';

import {entriesDataModel} from './response-models';
import type {GetEntriesDataResponseBody} from './response-models';

const requestSchema = {
    body: z.object({
        entryIds: zc.encodedIdArray({min: 1, max: 1000}),
        scope: z.nativeEnum(EntryScope).optional(),
        type: z.string().optional(),
        fields: z.string().array().min(1).max(100),
    }),
};

export type GetEntriesDataRequestBody = z.infer<typeof requestSchema.body>;

const parseReq = makeReqParser(requestSchema);

export const getEntriesDataController: AppRouteHandler = async (
    req: Request,
    res: Response<GetEntriesDataResponseBody>,
) => {
    const {body} = await parseReq(req);

    const result = await getJoinedEntriesRevisionsByIds(
        {ctx: req.ctx},
        {
            entryIds: body.entryIds,
            scope: body.scope,
            type: body.type,
        },
    );

    req.ctx.log('FILTERED_FIELDS', {
        fields: body.fields,
    });

    const response = entriesDataModel.format({
        result,
        entryIds: body.entryIds,
        fields: body.fields,
    });

    res.status(200).send(response);
};

getEntriesDataController.api = {
    summary: 'Get entries data',
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
            description: `${entriesDataModel.schema.description}`,
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: entriesDataModel.schema,
                },
            },
        },
    },
};

getEntriesDataController.manualDecodeId = true;
