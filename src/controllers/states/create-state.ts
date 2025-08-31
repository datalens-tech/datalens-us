import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {createState} from '../../services/new/state';

import {stateHashModel} from './response-models';

const requestSchema = {
    params: z.object({
        entryId: zc.encodedId(),
    }),
    body: z.object({
        data: z.record(z.string(), z.unknown()),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const createStateController: AppRouteHandler = async (req, res) => {
    const {params, body} = await parseReq(req);

    const result = await createState(
        {ctx: req.ctx},
        {
            entryId: params.entryId,
            data: body.data,
        },
    );

    res.status(200).send(stateHashModel.format(result));
};

createStateController.api = {
    tags: [ApiTag.States],
    summary: 'Create state',
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
            description: `${stateHashModel.schema.description}`,
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: stateHashModel.schema,
                },
            },
        },
    },
};

createStateController.manualDecodeId = true;
