import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import LockService from '../../services/lock.service';

import {lockModel} from './response-models';

const requestSchema = {
    params: z.object({
        entryId: zc.encodedId(),
    }),
    body: z.object({
        duration: z.number().min(1).optional(),
        lockToken: z.string().optional(),
        force: z.boolean().optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const extendController: AppRouteHandler = async (req, res) => {
    const {params, body} = await parseReq(req);

    const {entryId} = params;
    const {duration, lockToken, force} = body;

    const result = await LockService.extend({
        entryId,
        duration,
        lockToken,
        force,
        ctx: req.ctx,
    });

    res.status(200).send(result ? lockModel.format(result) : undefined);
};

extendController.api = {
    tags: [ApiTag.Locks],
    summary: 'Extend lock duration',
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
            description: `${lockModel.schema.description}`,
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: lockModel.schema,
                },
            },
        },
    },
};

extendController.manualDecodeId = true;
