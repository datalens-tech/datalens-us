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
    query: z.object({
        lockToken: z.string().optional(),
        force: zc.stringBoolean().optional(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const unlockController: AppRouteHandler = async (req, res) => {
    const {params, query} = await parseReq(req);

    const {entryId} = params;
    const {lockToken, force} = query;

    const result = await LockService.unlock({
        entryId,
        lockToken,
        force,
        ctx: req.ctx,
    });

    res.status(200).send(result ? lockModel.format(result) : undefined);
};

unlockController.api = {
    tags: [ApiTag.Locks],
    summary: 'Unlock entry',
    request: {
        params: requestSchema.params,
        query: requestSchema.query,
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

unlockController.manualDecodeId = true;
