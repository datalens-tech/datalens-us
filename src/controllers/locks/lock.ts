import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import LockService from '../../services/lock.service';

import {lockTokenModel} from './response-models';

const requestSchema = {
    params: z.object({
        entryId: zc.encodedId(),
    }),
    body: z.object({
        duration: z.number().min(1).optional(),
        force: z.boolean().optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const lockController: AppRouteHandler = async (req, res) => {
    const {params, body} = await parseReq(req);

    const {entryId} = params;
    const {duration, force} = body;

    const result = await LockService.lock({
        entryId,
        duration,
        force,
        ctx: req.ctx,
    });

    res.status(200).send(lockTokenModel.format(result));
};

lockController.api = {
    tags: [ApiTag.Locks],
    summary: 'Create lock',
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
            description: `${lockTokenModel.schema.description}`,
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: lockTokenModel.schema,
                },
            },
        },
    },
};

lockController.manualDecodeId = true;
