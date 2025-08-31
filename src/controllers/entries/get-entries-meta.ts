import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {EntryScope} from '../../db/models/new/entry/types';
import {getJoinedEntriesRevisionsByIds} from '../../services/new/entry';

import {entriesMetaModel} from './response-models';

const requestSchema = {
    body: z.object({
        entryIds: zc.encodedIdArray({min: 1, max: 1000}),
        scope: z.nativeEnum(EntryScope).optional(),
        type: z.string().optional(),
        fields: z
            .string()
            .refine((val) => !val.includes('.') && !val.includes('['), {
                message: 'nested fields or arrays are not supported',
            })
            .array()
            .min(1)
            .max(100),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getEntriesMetaController: AppRouteHandler = async (req, res) => {
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

    const response = entriesMetaModel.format({
        result,
        entryIds: body.entryIds,
        fields: body.fields,
    });

    res.status(200).send(response);
};

getEntriesMetaController.api = {
    summary: 'Get entries meta',
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
            description: `${entriesMetaModel.schema.description}`,
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: entriesMetaModel.schema,
                },
            },
        },
    },
};

getEntriesMetaController.manualDecodeId = true;
