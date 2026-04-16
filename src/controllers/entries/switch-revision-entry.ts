import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {switchRevisionEntry} from '../../services/entry';

import {switchRevisionEntryModel} from './response-models';

const requestSchema = {
    params: z.object({
        entryId: zc.encodedId(),
    }),
    body: z.object({
        revId: zc.encodedId(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const switchRevisionEntryController: AppRouteHandler = async (req, res) => {
    const {params, body} = await parseReq(req);

    const result = await switchRevisionEntry(
        {ctx: req.ctx},
        {
            entryId: params.entryId,
            revId: body.revId,
        },
    );

    res.status(200).send(switchRevisionEntryModel.format(result));
};

switchRevisionEntryController.api = {
    summary: 'Switch entry revision',
    tags: [ApiTag.Entries],
    request: {
        params: requestSchema.params,
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
            description: switchRevisionEntryModel.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: switchRevisionEntryModel.schema,
                },
            },
        },
    },
};

switchRevisionEntryController.manualDecodeId = true;
