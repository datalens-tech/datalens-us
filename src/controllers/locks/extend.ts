import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import Lock from '../../db/models/lock';
import LockService from '../../services/lock.service';

import {lockEntryModel} from './response-models/lock-entry-model';

const requestSchema = {
    params: z.object({
        entryId: zc.encodedId(),
    }),
    body: z.object({
        duration: z.coerce.number().min(1).max(600000),
        lockToken: z.string(),
        force: z.coerce.boolean().optional(),
    }),
};
const parseReq = makeReqParser(requestSchema);

export const extendController: AppRouteHandler = async (req, res: Response) => {
    const {params, body} = await parseReq(req);

    const {entryId} = params;
    const {duration, lockToken, force} = body;

    const result = (await LockService.extend({
        entryId,
        duration,
        lockToken,
        force,
        ctx: req.ctx,
    })) as unknown as Lock;

    res.status(200).send(lockEntryModel.format(result));
};

extendController.api = {
    tags: [ApiTag.Locks],
    summary: 'Extend lock duration for entry',
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
            description: lockEntryModel.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: lockEntryModel.schema,
                },
            },
        },
    },
};
extendController.manualDecodeId = true;
