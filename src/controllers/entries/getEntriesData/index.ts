import {AppRouteHandler, Request, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../../components/api-docs';
import {makeParser, z, zc} from '../../../components/zod';
import {CONTENT_TYPE_JSON} from '../../../const';
import {EntryScope} from '../../../db/models/new/entry/types';
import {getJoinedEntriesRevisionsByIds} from '../../../services/new/entry';

import type {GetEntriesDataResponseBody} from './response-model';
import {entriesData} from './response-model';

const requestSchema = {
    body: z.object({
        entryIds: zc.encodedIdArray({min: 1, max: 1000}),
        scope: z.nativeEnum(EntryScope).optional(),
        type: z.string().optional(),
        fields: z.string().array().min(1),
    }),
};

export type GetEntriesDataRequestBody = z.infer<typeof requestSchema.body>;

const parseBody = makeParser(requestSchema.body);

const controller: AppRouteHandler = async (
    req: Request,
    res: Response<GetEntriesDataResponseBody>,
) => {
    const body = await parseBody(req.body);

    const result = await getJoinedEntriesRevisionsByIds(
        {ctx: req.ctx},
        {
            entryIds: body.entryIds,
            scope: body.scope,
            type: body.type,
        },
    );

    const response = entriesData.format({result, fields: body.fields});

    res.status(200).send(response);
};

controller.api = {
    summary: 'Get entries data',
    tags: [ApiTag.Collections],
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
            description: entriesData.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: entriesData.schema,
                },
            },
        },
    },
};

controller.manualDecodeId = true;

export {controller as getEntriesData};
